import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Lazy load Resend
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('Resend is not configured');
  }
  const { Resend } = require('resend');
  return new Resend(key);
}

// POST /api/documents - Client uploads document (emailed to support)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || 'Document upload';

    if (!token || !file) {
      return NextResponse.json({ error: 'Token and file required' }, { status: 400 });
    }

    // Get lead info
    const lead = await prisma.lead.findUnique({ where: { token } });
    if (!lead) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Convert file to base64 for email attachment
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = buffer.toString('base64');

    // Send email with attachment via Resend
    try {
      const resend = getResend();
      
      const clientName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Unknown';
      
      await resend.emails.send({
        from: 'ALBS Portal <onboarding@simplifyingbusinesses.com>',
        to: ['support@simplifyingbusinesses.com'],
        reply_to: 'Franklintaxpros@gmail.com',
        subject: `📄 Document Upload: ${clientName} - ${file.name}`,
        html: `
          <h2>New Document Upload</h2>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Company:</strong> ${lead.company || 'N/A'}</p>
          <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Filename:</strong> ${file.name}</p>
          <p><strong>File size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
        `,
        attachments: [
          {
            filename: file.name,
            content: base64File,
          },
        ],
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Document sent to support team' 
      });
    } catch (emailError: any) {
      console.error('Resend email error:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send document. Please try again or email directly.' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}