'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme/theme-provider';
import { formatRelativeTime } from '@/lib/utils';
import {
  MessageSquare,
  Send,
  Pin,
  Lock,
  Globe,
  Users,
  Reply,
  ThumbsUp,
  Smile,
} from 'lucide-react';
import type { Discussion, DiscussionMessage } from '@/types/collaboration';

interface DiscussionThreadProps {
  vulnerabilityId: string;
  className?: string;
}

export default function DiscussionThread({ vulnerabilityId, className }: DiscussionThreadProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { preferences } = useTheme();

  useEffect(() => {
    fetchDiscussions();
  }, [vulnerabilityId]);

  useEffect(() => {
    if (selectedDiscussion) {
      fetchMessages(selectedDiscussion.id);
    }
  }, [selectedDiscussion]);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(`/api/discussions?vulnerabilityId=${vulnerabilityId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data);
        if (data.length > 0) {
          setSelectedDiscussion(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (discussionId: string) => {
    try {
      const response = await fetch(`/api/discussions/${discussionId}/messages`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDiscussion || sending) return;

    try {
      setSending(true);
      const response = await fetch(`/api/discussions/${selectedDiscussion.id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        toast({
          title: 'Message sent',
          description: 'Your message has been posted',
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Discussions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Discussions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Discussions</span>
            <Badge variant="outline">{discussions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {discussions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Discussions Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start the first discussion about this vulnerability
              </p>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Discussion
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {discussions.map((discussion) => (
                <Card
                  key={discussion.id}
                  className={`cursor-pointer transition-colors ${
                    selectedDiscussion?.id === discussion.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedDiscussion(discussion)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {discussion.title}
                          </h3>
                          {discussion.isPinned && (
                            <Pin className="h-4 w-4 text-yellow-500" />
                          )}
                          {discussion.isPublic ? (
                            <Globe className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-500" />
                          )}
                          <Badge className={getStatusColor(discussion.status)}>
                            {discussion.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {discussion.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>by {discussion.authorDisplayName}</span>
                          <span>{formatRelativeTime(discussion.createdAt, preferences?.language || 'en')}</span>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{discussion.participantCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{discussion.messageCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      {selectedDiscussion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>{selectedDiscussion.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                        {message.authorDisplayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {message.authorDisplayName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(message.createdAt, preferences?.language || 'en')}
                        </span>
                        {message.isEdited && (
                          <Badge variant="outline" className="text-xs">
                            edited
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {message.content}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Smile className="h-3 w-3 mr-1" />
                          React
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Write a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
