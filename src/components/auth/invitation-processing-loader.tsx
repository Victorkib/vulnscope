'use client';

import { useAuth } from './auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, CheckCircle } from 'lucide-react';

interface InvitationProcessingLoaderProps {
  className?: string;
}

export default function InvitationProcessingLoader({ className }: InvitationProcessingLoaderProps) {
  const { processingInvitations } = useAuth();

  if (!processingInvitations) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Processing Team Invitations
              </h3>
              <p className="text-sm text-gray-600">
                Checking for pending team invitations and connecting you to your teams...
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Please wait</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
