import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/supabase-server';
import { userInvitationService } from '@/lib/user-invitation-service';

export async function GET(request: NextRequest) {
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

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get pending invitations
    const pendingInvitations = await userInvitationService.getPendingInvitations(userEmail);

    return NextResponse.json({
      success: true,
      data: pendingInvitations
    });

  } catch (error) {
    console.error('Error getting pending invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
