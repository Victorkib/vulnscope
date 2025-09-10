import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { userInvitationService } from '@/lib/user-invitation-service';

export async function POST(request: NextRequest) {
  try {
    // Get the current user using the existing server auth pattern
    const { user, error: authError } = await getServerUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = user.email;
    const userId = user.id;
    const userDisplayName = user.user_metadata?.display_name || 
                          user.email?.split('@')[0] || 
                          'User';

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Check and process pending invitations
    const invitationResult = await userInvitationService.checkAndProcessPendingInvitations(
      userEmail,
      userId,
      userDisplayName
    );

    return NextResponse.json({
      success: true,
      data: invitationResult
    });

  } catch (error) {
    console.error('Error checking pending invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
