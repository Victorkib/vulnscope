'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Send, X } from 'lucide-react';

interface ReplyFormProps {
  parentCommentId: string;
  vulnerabilityId: string;
  onReplySubmitted: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export default function ReplyForm({
  parentCommentId,
  vulnerabilityId,
  onReplySubmitted,
  onCancel,
  placeholder = 'Write a reply...',
}: ReplyFormProps) {
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast({
        title: 'Error',
        description: 'Reply content cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    if (replyContent.length > 2000) {
      toast({
        title: 'Error',
        description: 'Reply is too long (max 2000 characters)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await apiClient.post(`/api/vulnerabilities/${vulnerabilityId}/comments`, {
        content: replyContent.trim(),
        isPublic: true,
        parentId: parentCommentId,
      });

      setReplyContent('');
      onReplySubmitted();
      
      toast({
        title: 'Reply posted',
        description: 'Your reply has been posted successfully',
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-3 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
            maxLength={2000}
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {replyContent.length}/2000 characters
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-8 px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !replyContent.trim()}
                className="h-8 px-3"
              >
                <Send className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Posting...' : 'Reply'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
