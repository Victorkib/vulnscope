'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, TestTube } from 'lucide-react';

export default function TestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestNotification = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/test/notification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Test Notification Sent',
          description: 'Check your notification bell for the test notification!',
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={sendTestNotification}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <TestTube className="h-4 w-4" />
      {isLoading ? 'Sending...' : 'Test Notification'}
    </Button>
  );
}
