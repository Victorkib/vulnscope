import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { notificationTemplateService } from '@/lib/notification-template-service';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      titleTemplate,
      messageTemplate,
      variables,
      isActive,
    } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (titleTemplate !== undefined) updates.titleTemplate = titleTemplate;
    if (messageTemplate !== undefined) updates.messageTemplate = messageTemplate;
    if (variables !== undefined) updates.variables = variables;
    if (isActive !== undefined) updates.isActive = isActive;

    const success = await notificationTemplateService.updateUserTemplate(user.id, id, updates);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Template not found or update failed' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await notificationTemplateService.deleteUserTemplate(user.id, id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Template not found or cannot be deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
