import { NextResponse } from 'next/server';
import { initializeAdminSystem, checkAdminSystemStatus } from '@/scripts/initialize-admin';

export async function POST() {
  try {
    // Check if admin system is already initialized
    const status = await checkAdminSystemStatus();
    
    if (status.initialized) {
      return NextResponse.json({
        success: true,
        message: 'Admin system is already initialized',
        status
      });
    }
    
    // Initialize the admin system
    const result = await initializeAdminSystem();
    
    return NextResponse.json({
      success: true,
      message: 'Admin system initialized successfully',
      result
    });
  } catch (error) {
    console.error('Error initializing admin system:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize admin system',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = await checkAdminSystemStatus();
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error checking admin system status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check admin system status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
