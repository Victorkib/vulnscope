'use client';

import { Loader2, Users, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoadingStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function LoadingState({ 
  title = "Loading...", 
  description = "Please wait while we process your request",
  icon = <Loader2 className="w-6 h-6 animate-spin" />,
  className = ""
}: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <Card className={`animate-pulse ${className}`}>
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
  );
}

interface ProcessingStateProps {
  title: string;
  description: string;
  isProcessing: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ProcessingState({ 
  title, 
  description, 
  isProcessing, 
  children, 
  className = "" 
}: ProcessingStateProps) {
  if (isProcessing) {
    return (
      <div className={`relative ${className}`}>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface SuccessStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SuccessState({ 
  title, 
  description, 
  icon = <CheckCircle className="w-12 h-12 text-green-600" />,
  className = ""
}: SuccessStateProps) {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
          {icon}
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-ping">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-green-600 mb-2 animate-fade-in">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ErrorState({ 
  title, 
  description, 
  icon = <AlertCircle className="w-12 h-12 text-red-600" />,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-red-600 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

// Specialized loading states for different contexts
export function TeamInvitationLoadingState({ className = "" }: { className?: string }) {
  return (
    <LoadingState
      title="Processing Team Invitations"
      description="Checking for pending team invitations and connecting you to your teams..."
      icon={<Users className="w-6 h-6 text-white" />}
      className={className}
    />
  );
}

export function EmailInvitationLoadingState({ className = "" }: { className?: string }) {
  return (
    <LoadingState
      title="Sending Invitation"
      description="Sending team invitation email to the new member..."
      icon={<Mail className="w-6 h-6 text-white" />}
      className={className}
    />
  );
}
