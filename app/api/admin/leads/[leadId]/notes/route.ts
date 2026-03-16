import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/leads/[leadId]/notes - Get all notes for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const notes = await prisma.note.findMany({
      where: { leadId: params.leadId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leads/[leadId]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await request.json();
    const { content, createdBy } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        leadId: params.leadId,
        content,
        createdBy: createdBy || 'Admin',
        isInternal: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        leadId: params.leadId,
        type: 'NOTE_ADDED',
        description: `Note added`,
        actor: createdBy || 'Admin',
      },
    });

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/leads/[leadId]/notes - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}