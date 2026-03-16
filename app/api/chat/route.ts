import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Lazy load Resend
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('Resend not configured');
    return null;
  }
  const { Resend } = require('resend');
  return new Resend(key);
}

// GET /api/chat - Get messages for admin (from database), client gets empty since chats aren't saved
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const token = searchParams.get('token');
    const conversations = searchParams.get('conversations');

    // Admin: Get all conversations with latest message
    if (conversations === 'true') {
      const leads = await prisma.lead.findMany({
        where: {
          status: { in: ['ONBOARDING', 'CONTRACT', 'PAYMENT', 'ACTIVE', 'COMPLETE'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
          clientRequests: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const result = leads.map(lead => ({
        leadId: lead.id,
        name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Unknown',
        lastMessage: lead.clientRequests[0]?.message || 'No messages yet',
        unreadCount: lead.clientRequests.filter(r => r.status === 'OPEN').length,
      }));

      return NextResponse.json({ conversations: result });
    }

    // Get messages for specific lead (for admin viewing a lead's chat)
    if (leadId) {
      const requests = await prisma.clientRequest.findMany({
        where: { leadId },
        orderBy: { createdAt: 'asc' },
      });
      
      const messages = requests.map(r => ({
        id: r.id,
        content: r.message,
        sender: r.subject?.includes('Reply from') || r.subject?.includes('Proposal') ? 'admin' : 'client',
        senderName: r.subject?.includes('Reply from') ? 'ALBS Team' : r.subject?.includes('Proposal') ? 'ALBS Team' : 'Client',
        createdAt: r.createdAt.toISOString(),
        read: r.status === 'RESOLVED',
      }));
      
      // Mark as read when admin views
      await prisma.clientRequest.updateMany({
        where: { leadId, status: 'OPEN' },
        data: { status: 'RESOLVED' },
      });
      
      return NextResponse.json({ messages });
    }

    // Get messages for client view (via token) - fetch from clientRequest table
    if (token) {
      const lead = await prisma.lead.findUnique({ where: { token } });
      if (lead) {
        const requests = await prisma.clientRequest.findMany({
          where: { leadId: lead.id },
          orderBy: { createdAt: 'asc' },
        });
        
        const messages = requests.map(r => ({
          id: r.id,
          content: r.message,
          sender: r.subject?.includes('Reply from') || r.subject?.includes('Proposal') || r.subject?.includes('ALBS') ? 'admin' : 'client',
          senderName: r.subject?.includes('Reply from') || r.subject?.includes('Proposal') || r.subject?.includes('ALBS') ? 'ALBS Team' : 'Client',
          createdAt: r.createdAt.toISOString(),
          read: r.status === 'RESOLVED',
        }));
        
        return NextResponse.json({ messages });
      }
    }

    // Return empty if no leadId or token - they use the client portal
    return NextResponse.json({ messages: [] });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat - Send a message (client: email to support, admin: save + email to client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, token, content, isAdmin, recipientEmail } = body;

    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    let lead;
    if (leadId) {
      lead = await prisma.lead.findUnique({ where: { id: leadId } });
    } else if (token) {
      lead = await prisma.lead.findUnique({ where: { token } });
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const clientName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Client';

    // CLIENT MESSAGE: Save to database AND email to support team
    if (!isAdmin) {
      // Save client message to database so admin can see it
      const clientRequest = await prisma.clientRequest.create({
        data: {
          leadId: lead.id,
          subject: `Message from ${clientName}`,
          message: content,
          status: 'OPEN',
        },
      });

      // Also email to support team
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: 'ALBS Portal <onboarding@resend.dev>',
          reply_to: 'Franklintaxpros@gmail.com',
          to: ['support@simplifyingbusinesses.com'],
          subject: `💬 New Message from ${clientName}`,
          html: `
            <h2>New Client Message</h2>
            <p><strong>From:</strong> ${clientName}</p>
            <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
            <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
            <hr>
            <h3>Message:</h3>
            <p>${content.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><em>Reply to this client through the Admin Portal</em></p>
            <p><a href="https://onboarding.simplifyingbusinesses.com/admin">Open Admin Portal</a></p>
          `,
        });
      }

      // Update lead's updatedAt
      await prisma.lead.update({
        where: { id: lead.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: {
          id: clientRequest.id,
          content: clientRequest.message,
          sender: 'client',
          senderName: 'You',
          createdAt: clientRequest.createdAt.toISOString(),
        }
      });
    }

    // ADMIN MESSAGE: Save to database AND email to client
    const clientRequest = await prisma.clientRequest.create({
      data: {
        leadId: lead.id,
        subject: 'Reply from ALBS',
        message: content,
        status: 'OPEN',
      },
    });

    // Send email to client
    if (lead.email) {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: 'ALBS <onboarding@resend.dev>',
          reply_to: 'Franklintaxpros@gmail.com',
          to: [lead.email],
          subject: '📬 New message from ALBS',
          html: `
            <h2>New Message from ALBS</h2>
            <p>Hi ${lead.firstName || 'there'},</p>
            <p>You have a new message from the ALBS team:</p>
            <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #6366f1; margin: 15px 0;">
              ${content.replace(/\n/g, '<br>')}
            </blockquote>
            <p>Login to your <a href="https://onboarding.simplifyingbusinesses.com/client/${lead.token}">Client Portal</a> to respond.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              ALBS Client Portal<br>
              Simplifying Businesses
            </p>
          `,
        });
      }
    }

    // If admin responds, mark previous client requests as resolved
    await prisma.clientRequest.updateMany({
      where: { 
        leadId: lead.id,
        status: 'OPEN',
      },
      data: { status: 'RESOLVED' },
    });

    // Update lead's updatedAt
    await prisma.lead.update({
      where: { id: lead.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: clientRequest.id,
        content: clientRequest.message,
        sender: 'admin',
        senderName: 'ALBS Team',
        createdAt: clientRequest.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/chat - Admin sends a new service proposal to client
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, serviceName, serviceDescription, price, interval } = body;

    if (!leadId || !serviceName || !price) {
      return NextResponse.json({ error: 'Lead ID, service name, and price required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const clientName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'there';

    // Email proposal to client
    const resend = getResend();
    if (resend && lead.email) {
      await resend.emails.send({
        from: 'ALBS <onboarding@resend.dev>',
        reply_to: 'Franklintaxpros@gmail.com',
        to: [lead.email],
        subject: '📋 New Service Proposal from ALBS',
        html: `
          <h2>New Service Proposal</h2>
          <p>Hi ${clientName},</p>
          <p>We'd like to propose the following additional service:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0;">${serviceName}</h3>
            <p>${serviceDescription || 'Additional service for your business.'}</p>
            <p style="font-size: 24px; font-weight: bold; color: #6366f1;">
              $${(price / 100).toFixed(2)}/${interval === 'YEARLY' ? 'year' : 'month'}
            </p>
          </div>
          <p>Login to your <a href="https://onboarding.simplifyingbusinesses.com/client/${lead.token}">Client Portal</a> to accept or decline this proposal.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            ALBS Client Portal<br>
            Simplifying Businesses
          </p>
        `,
      });
    }

    // Create a client request record for the proposal
    await prisma.clientRequest.create({
      data: {
        leadId: lead.id,
        subject: `Service Proposal: ${serviceName}`,
        message: `PROPOSAL: ${serviceName} - $${(price / 100).toFixed(2)}/${interval === 'YEARLY' ? 'year' : 'month'}\n\n${serviceDescription || ''}`,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ success: true, message: 'Proposal sent to client' });
  } catch (error: any) {
    console.error('Proposal send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}