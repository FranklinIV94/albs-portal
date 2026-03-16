import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/leads/[leadId]/tasks - Get all tasks for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: { leadId: params.leadId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leads/[leadId]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await request.json();
    const { title, description, assignee, dueDate, priority } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        leadId: params.leadId,
        title,
        description: description || null,
        assignee: assignee || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        leadId: params.leadId,
        type: 'TASK_CREATED',
        description: `Task created: ${title}`,
        actor: assignee || 'Admin',
      },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/leads/[leadId]/tasks - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await request.json();
    const { taskId, title, description, assignee, dueDate, status, priority, completedAt } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignee !== undefined) updateData.assignee = assignee;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;

    // Check if task is being completed
    if (status === 'COMPLETED' && !completedAt) {
      updateData.completedAt = new Date();
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Log activity if completed
    if (status === 'COMPLETED') {
      await prisma.activityLog.create({
        data: {
          leadId: params.leadId,
          type: 'TASK_COMPLETED',
          description: `Task completed: ${task.title}`,
          actor: 'Admin',
        },
      });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/leads/[leadId]/tasks - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}