'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

interface PendingInvitation {
  id: string;
  teamId: string;
  teamName: string;
  teamDescription?: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  invitationToken: string;
  invitationUrl: string;
}

interface InvitationManagerProps {
  className?: string;
}

export default function InvitationManager({ className }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users/invitations');
      setInvitations(response.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending invitations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationToken: string, teamName: string) => {
    try {
      setProcessing(invitationToken);
      
      const response = await apiClient.post('/api/users/invitations', {
        invitationToken,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `You have successfully joined "${teamName}"`,
        });
        
        // Remove the accepted invitation from the list
        setInvitations(prev => prev.filter(inv => inv.invitationToken !== invitationToken));
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const declineInvitation = async (invitationToken: string, teamName: string) => {
    try {
      setProcessing(invitationToken);
      
      const response = await apiClient.post('/api/users/invitations/decline', {
        invitationToken,
      });

      if (response.success) {
        toast({
          title: 'Invitation Declined',
          description: `You have declined the invitation to join "${teamName}"`,
        });
        
        // Remove the declined invitation from the list
        setInvitations(prev => prev.filter(inv => inv.invitationToken !== invitationToken));
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiration < 24 && hoursUntilExpiration > 0;
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Team Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton */}
            {[1, 2].map((i) => (
              <Card key={i} className="border-l-4 border-l-gray-200 animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-9 bg-gray-200 rounded flex-1"></div>
                      <div className="h-9 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Loading invitations...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Team Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No pending team invitations</p>
            <p className="text-sm text-gray-400 mt-2">
              You'll see team invitations here when someone invites you to join their team.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Team Invitations
          <Badge variant="secondary">{invitations.length}</Badge>
        </CardTitle>
        <CardDescription>
          You have {invitations.length} pending team invitation{invitations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map((invitation) => {
          const isExpiredInvitation = isExpired(invitation.expiresAt);
          const isExpiringSoonInvitation = isExpiringSoon(invitation.expiresAt);
          const isProcessingInvitation = processing === invitation.invitationToken;

          return (
            <Card key={invitation.id} className={`border-l-4 border-l-blue-500 ${isProcessingInvitation ? 'opacity-75' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{invitation.teamName}</CardTitle>
                    {invitation.teamDescription && (
                      <CardDescription className="mt-1">
                        {invitation.teamDescription}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(invitation.role)}>
                      {invitation.role}
                    </Badge>
                    {isExpiredInvitation && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {isExpiringSoonInvitation && !isExpiredInvitation && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Expires Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Invited by {invitation.invitedByName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Invited on {formatDate(invitation.invitedAt)}</span>
                  </div>

                  {!isExpiredInvitation && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Expires on {formatDate(invitation.expiresAt)}</span>
                    </div>
                  )}

                  {isExpiredInvitation && (
                    <Alert>
                      <AlertDescription>
                        This invitation has expired. Please contact the team owner for a new invitation.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!isExpiredInvitation && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => acceptInvitation(invitation.invitationToken, invitation.teamName)}
                        disabled={isProcessingInvitation}
                        className="flex-1"
                      >
                        {isProcessingInvitation ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => declineInvitation(invitation.invitationToken, invitation.teamName)}
                        disabled={isProcessingInvitation}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
