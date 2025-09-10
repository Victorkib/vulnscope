'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Users, Mail, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { invitationService } from '@/lib/invitation-service';

interface InvitationData {
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export default function InvitationAcceptPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [teamInfo, setTeamInfo] = useState<{ name: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Validate the invitation token
    const data = invitationService.validateInvitationToken(token);
    if (!data) {
      setError('Invalid or expired invitation token');
      setLoading(false);
      return;
    }

    setInvitationData(data);
    fetchTeamInfo(data.teamId);
  }, [searchParams]);

  const fetchTeamInfo = async (teamId: string) => {
    try {
      const response = await apiClient.get(`/api/teams/${teamId}`);
      setTeamInfo({
        name: response.name,
        description: response.description,
      });
    } catch (error) {
      console.error('Error fetching team info:', error);
      setError('Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitationData || !user) return;

    try {
      setProcessing(true);
      
      const response = await apiClient.post('/api/users/invitations', {
        invitationToken: searchParams.get('token'),
      });

      if (response.success) {
        setSuccess(true);
        toast({
          title: 'Success',
          description: `You have successfully joined "${teamInfo?.name}"`,
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitationData || !user) return;

    try {
      setProcessing(true);
      
      const response = await apiClient.post('/api/users/invitations/decline', {
        invitationToken: searchParams.get('token'),
      });

      if (response.success) {
        toast({
          title: 'Invitation Declined',
          description: `You have declined the invitation to join "${teamInfo?.name}"`,
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = invitationData ? new Date(invitationData.expiresAt) < new Date() : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Loading Invitation</CardTitle>
            <CardDescription>
              Validating your team invitation...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Please wait</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-3 animate-fade-in">Welcome to the Team!</h2>
            <p className="text-gray-600 mb-4 text-lg">
              You have successfully joined <strong className="text-green-700">{teamInfo?.name}</strong>
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              You need to sign in to accept this team invitation.
            </p>
            <div className="text-center">
              <Button onClick={() => router.push('/')} className="w-full">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationData && invitationData.email !== user.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Wrong Email Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This invitation is for {invitationData.email}, but you're signed in as {user.email}.
                Please sign in with the correct email address.
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => router.push('/')} variant="outline">
                Sign In with Correct Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team on VulnScope
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isExpired && (
            <Alert variant="destructive">
              <AlertDescription>
                This invitation has expired. Please contact the team owner for a new invitation.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{teamInfo?.name}</h3>
            {teamInfo?.description && (
              <p className="text-gray-600 mb-4">{teamInfo.description}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Your Role:</span>
              <Badge className={getRoleColor(invitationData?.role || '')}>
                {invitationData?.role}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Invited By:</span>
              <span className="text-sm font-medium">{invitationData?.invitedBy}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expires:</span>
              <span className="text-sm">{formatDate(invitationData?.expiresAt || '')}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">What you can do as a team member:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Collaborate on vulnerability research</li>
              <li>• Share and discuss vulnerabilities with team members</li>
              <li>• Participate in threaded discussions about security findings</li>
              <li>• Access team-specific vulnerability insights and reports</li>
            </ul>
          </div>

          {!isExpired && (
            <div className="flex gap-3">
              <Button
                onClick={handleAcceptInvitation}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeclineInvitation}
                disabled={processing}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {isExpired && (
            <div className="text-center">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
