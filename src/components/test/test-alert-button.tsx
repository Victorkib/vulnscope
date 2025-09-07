'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, TestTube } from 'lucide-react';

export default function TestAlertButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestAlert = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/test/alert', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: 'Test Alert Sent',
          description: 'Check your notifications and alert rules for the test alert!',
        });
      } else {
        throw new Error('Failed to send test alert');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test alert',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={sendTestAlert}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <TestTube className="h-4 w-4" />
      {isLoading ? 'Sending...' : 'Test Alert'}
    </Button>
  );
}
