import { NextResponse } from 'next/server';

// Mock notifications for testing
const mockNotifications = [
  {
    id: 'test-1',
    userId: 'test-user',
    type: 'system_alert',
    title: 'Welcome to VulnScope!',
    message: 'Your notification system is now working properly.',
    data: { test: true },
    isRead: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-2',
    userId: 'test-user',
    type: 'vulnerability_alert',
    title: 'New Critical Vulnerability Detected',
    message: 'CVE-2024-1234 has been discovered with a CVSS score of 9.8',
    data: { cveId: 'CVE-2024-1234', severity: 'CRITICAL' },
    isRead: false,
    priority: 'critical',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'test-3',
    userId: 'test-user',
    type: 'bookmark_update',
    title: 'Bookmark Updated',
    message: 'Vulnerability CVE-2024-5678 has been updated in your bookmarks',
    data: { vulnerabilityId: 'CVE-2024-5678', action: 'updated' },
    isRead: true,
    priority: 'low',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
];

export async function GET() {
  try {
    // Return mock notifications for testing
    return NextResponse.json(mockNotifications);
  } catch (error) {
    console.error('Error fetching test notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test notifications' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Create a new test notification
    const newNotification = {
      id: `test-${Date.now()}`,
      userId: 'test-user',
      type: 'system_alert',
      title: 'Test Notification',
      message: 'This is a test notification created at ' + new Date().toLocaleTimeString(),
      data: { test: true, timestamp: Date.now() },
      isRead: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
    };

    // In a real app, this would be saved to the database
    mockNotifications.unshift(newNotification);

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
