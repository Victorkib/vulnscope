import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';
import type { SystemConfig } from '@/types/admin';

// GET /api/admin/system/config - Get system configuration
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['system_config'], request);
    
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const key = url.searchParams.get('key');
    
    const db = await getDatabase();
    const configCollection = db.collection('system_config');
    
    // Build query
    const query: any = {};
    if (category) query.category = category;
    if (key) query.key = key;
    
    const configs = await configCollection.find(query).sort({ category: 1, key: 1 }).toArray();
    
    return NextResponse.json({
      success: true,
      data: configs,
      count: configs.length
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch system configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/system/config - Create or update system configuration
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['system_config'], request);
    
    const body = await request.json();
    const { key, value, category, description, isEditable, requiresRestart } = body;
    
    if (!key || !category) {
      return NextResponse.json(
        { error: 'key and category are required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const configCollection = db.collection('system_config');
    
    // Check if config exists
    const existingConfig = await configCollection.findOne({ key });
    
    const configData: SystemConfig = {
      key,
      value,
      category,
      description: description || '',
      isEditable: isEditable !== false,
      requiresRestart: requiresRestart || false,
      updatedBy: adminUser.userId,
      updatedAt: new Date().toISOString()
    };
    
    if (existingConfig) {
      // Update existing config
      await configCollection.updateOne(
        { key },
        { $set: configData }
      );
      
      // Log the action
      await adminAuthService.logAdminAction(
        adminUser.userId,
        'config_change',
        {
          targetId: key,
          targetType: 'config',
          oldValue: existingConfig.value,
          newValue: value,
          reason: 'System configuration updated',
          description: `Configuration ${key} updated by admin`
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'System configuration updated successfully'
      });
    } else {
      // Create new config
      await configCollection.insertOne(configData as any);
      
      // Log the action
      await adminAuthService.logAdminAction(
        adminUser.userId,
        'config_change',
        {
          targetId: key,
          targetType: 'config',
          oldValue: null,
          newValue: value,
          reason: 'System configuration created',
          description: `Configuration ${key} created by admin`
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'System configuration created successfully'
      });
    }
  } catch (error) {
    console.error('Error managing system config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage system configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/system/config - Delete system configuration
export async function DELETE(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['system_config'], request);
    
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { error: 'key parameter is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const configCollection = db.collection('system_config');
    
    // Get current config
    const currentConfig = await configCollection.findOne({ key });
    if (!currentConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }
    
    // Check if config is editable
    if (!currentConfig.isEditable) {
      return NextResponse.json(
        { error: 'This configuration cannot be deleted' },
        { status: 400 }
      );
    }
    
    // Delete config
    await configCollection.deleteOne({ key });
    
    // Log the action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'config_change',
      {
        targetId: key,
        targetType: 'config',
        oldValue: currentConfig.value,
        newValue: null,
        reason: 'System configuration deleted',
        description: `Configuration ${key} deleted by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'System configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting system config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete system configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
