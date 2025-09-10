import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { notificationTemplateService } from '@/lib/notification-template-service';

export async function GET(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') as any;
    const action = url.searchParams.get('action');

    if (action === 'variables') {
      // Get available template variables
      const variables = type 
        ? notificationTemplateService.getVariablesForType(type)
        : notificationTemplateService.getAllVariables();
      
      return NextResponse.json(variables);
    } else if (action === 'defaults') {
      // Get default templates
      const defaultTemplates = notificationTemplateService.getDefaultTemplates();
      return NextResponse.json(defaultTemplates);
    } else {
      // Get user templates
      const templates = await notificationTemplateService.getUserTemplates(user.id, type);
      return NextResponse.json(templates);
    }
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getServerUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      titleTemplate,
      messageTemplate,
      variables = [],
      isActive = true,
    } = body;

    if (!name || !type || !titleTemplate || !messageTemplate) {
      return NextResponse.json(
        { error: 'Name, type, titleTemplate, and messageTemplate are required' },
        { status: 400 }
      );
    }

    const template = await notificationTemplateService.createUserTemplate(user.id, {
      name,
      description,
      type,
      titleTemplate,
      messageTemplate,
      variables,
      isDefault: false,
      isActive,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
