'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import type { CommentWithVotes } from '@/types/community';

interface UseRealtimeCommentsOptions {
  vulnerabilityId: string;
  enabled?: boolean;
  onCommentAdded?: (comment: CommentWithVotes) => void;
  onCommentUpdated?: (comment: CommentWithVotes) => void;
  onCommentDeleted?: (commentId: string) => void;
  onVoteUpdated?: (commentId: string, likes: number, dislikes: number, userVote: string | null) => void;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

export function useRealtimeComments({
  vulnerabilityId,
  enabled = true,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  onVoteUpdated,
  fallbackToPolling = true,
  pollingInterval = 10000, // 10 seconds for comments
}: UseRealtimeCommentsOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<Date | null>(null);
  const subscriptionRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommentCountRef = useRef<number>(0);
  const isSettingUpRef = useRef<boolean>(false);
  
  // Store callback functions in refs to prevent re-creation
  const onCommentAddedRef = useRef(onCommentAdded);
  const onCommentUpdatedRef = useRef(onCommentUpdated);
  const onCommentDeletedRef = useRef(onCommentDeleted);
  const onVoteUpdatedRef = useRef(onVoteUpdated);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCommentAddedRef.current = onCommentAdded;
    onCommentUpdatedRef.current = onCommentUpdated;
    onCommentDeletedRef.current = onCommentDeleted;
    onVoteUpdatedRef.current = onVoteUpdated;
  }, [onCommentAdded, onCommentUpdated, onCommentDeleted, onVoteUpdated]);

  // Polling fallback for when real-time is not available
  const startPolling = useCallback(async () => {
    if (pollingRef.current) return;

    const pollForUpdates = async () => {
      try {
        // Check for new comments by fetching the count
        const response = await fetch(`/api/vulnerabilities/${vulnerabilityId}/comments/count`);
        if (response.ok) {
          const { count } = await response.json();
          
          if (count > lastCommentCountRef.current) {
            // New comments detected, trigger a refresh
            onCommentAddedRef.current?.(null as any); // Signal that comments need to be refreshed
            lastCommentCountRef.current = count;
          }
        }
      } catch (error) {
        console.error('Error polling for comment updates:', error);
      }
    };

    // Initial poll
    await pollForUpdates();
    
    // Set up interval
    pollingRef.current = setInterval(pollForUpdates, pollingInterval);
    setUsePolling(true);
  }, [vulnerabilityId, pollingInterval]); // Remove onCommentAdded dependency

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setUsePolling(false);
  }, []);

  // Handle real-time comment events
  const handleCommentChange = useCallback((payload: any) => {
    console.log('🔄 Real-time comment change received:', payload);
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord && onCommentAddedRef.current) {
          const comment: CommentWithVotes = {
            id: newRecord.id,
            content: newRecord.content,
            userId: newRecord.user_id,
            userEmail: newRecord.user_email,
            userDisplayName: newRecord.user_display_name,
            vulnerabilityId: newRecord.vulnerabilityid,
            isPublic: newRecord.is_public,
            createdAt: newRecord.created_at,
            updatedAt: newRecord.updated_at,
            likes: newRecord.likes || 0,
            dislikes: newRecord.dislikes || 0,
            isEdited: newRecord.is_edited || false,
            parentId: newRecord.parent_id,
            userVote: undefined,
            userReputation: 0,
            userLevel: 1,
            userBadges: [],
            replies: [],
          };
          onCommentAddedRef.current(comment);
        }
        break;

      case 'UPDATE':
        if (newRecord && onCommentUpdatedRef.current) {
          const comment: CommentWithVotes = {
            id: newRecord.id,
            content: newRecord.content,
            userId: newRecord.user_id,
            userEmail: newRecord.user_email,
            userDisplayName: newRecord.user_display_name,
            vulnerabilityId: newRecord.vulnerabilityid,
            isPublic: newRecord.is_public,
            createdAt: newRecord.created_at,
            updatedAt: newRecord.updated_at,
            likes: newRecord.likes || 0,
            dislikes: newRecord.dislikes || 0,
            isEdited: newRecord.is_edited || false,
            parentId: newRecord.parent_id,
            userVote: undefined,
            userReputation: 0,
            userLevel: 1,
            userBadges: [],
            replies: [],
          };
          onCommentUpdatedRef.current(comment);
        }
        break;

      case 'DELETE':
        if (oldRecord && onCommentDeletedRef.current) {
          onCommentDeletedRef.current(oldRecord.id);
        }
        break;
    }
  }, []); // Remove dependencies to prevent re-creation

  // Handle real-time vote events
  const handleVoteChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
      // Fetch updated comment data to get current vote counts
      const commentId = newRecord?.comment_id || oldRecord?.comment_id;
      if (commentId && onVoteUpdatedRef.current) {
        // Get the updated comment with vote counts
        (async () => {
          try {
            const { data: comment } = await supabase
              .from('vulnerability_comments')
              .select('id, likes, dislikes')
              .eq('id', commentId)
              .single();

            if (comment) {
              // Get user's vote for this comment
              const { data: vote } = await supabase
                .from('comment_votes')
                .select('vote_type')
                .eq('comment_id', commentId)
                .eq('user_id', user?.id)
                .single();

              onVoteUpdatedRef.current(
                comment.id,
                comment.likes || 0,
                comment.dislikes || 0,
                vote?.vote_type || null
              );
            }
          } catch (error) {
            console.error('Error fetching updated comment data:', error);
          }
        })();
      }
    }
  }, []); // Remove dependencies to prevent re-creation

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !user || !vulnerabilityId || !supabase) {
      console.log('Real-time subscription skipped:', { enabled, user: !!user, vulnerabilityId, supabase: !!supabase });
      return;
    }

    console.log('Setting up real-time subscription for vulnerability:', vulnerabilityId);

    const setupRealtimeSubscription = async () => {
      // Prevent multiple simultaneous setup attempts
      if (isSettingUpRef.current) {
        console.log('Real-time setup already in progress, skipping');
        return;
      }

      isSettingUpRef.current = true;

      try {
        // Clean up any existing subscription first
        if (subscriptionRef.current) {
          console.log('Cleaning up existing subscription');
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }

        // Subscribe to comment changes for this vulnerability
        subscriptionRef.current = supabase
          .channel(`vulnerability_comments:${vulnerabilityId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vulnerability_comments',
              filter: `vulnerabilityid=eq.${vulnerabilityId}`,
            },
            handleCommentChange
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'comment_votes',
            },
            handleVoteChange
          )
          .subscribe((status) => {
            console.log('Real-time subscription status:', status);
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionError(null);
              setUsePolling(false);
              setConnectionAttempts(0);
              setLastConnectionTime(new Date());
              stopPolling();
              isSettingUpRef.current = false;
              console.log('✅ Real-time comment subscription active for vulnerability:', vulnerabilityId);
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              setConnectionAttempts(prev => prev + 1);
              setConnectionError('Failed to connect to real-time comments');
              console.error('❌ Real-time subscription failed, falling back to polling');
              if (fallbackToPolling) {
                startPolling();
              }
            } else if (status === 'TIMED_OUT') {
              setIsConnected(false);
              setConnectionError('Real-time connection timed out');
              console.warn('⏰ Real-time subscription timed out, falling back to polling');
              if (fallbackToPolling) {
                startPolling();
              }
            } else if (status === 'CLOSED') {
              setIsConnected(false);
              setConnectionError('Real-time connection closed');
              console.warn('🔌 Real-time subscription closed');
            }
          });
      } catch (error) {
        console.error('Error setting up real-time comment subscription:', error);
        setConnectionError('Failed to setup real-time comments');
        setIsConnected(false);
        setConnectionAttempts(prev => prev + 1);
        isSettingUpRef.current = false;
        if (fallbackToPolling) {
          startPolling();
        }
      }
    };

    setupRealtimeSubscription();

    return () => {
      console.log('Cleaning up real-time subscription on unmount');
      isSettingUpRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      stopPolling();
    };
  }, [
    enabled,
    user?.id, // Only depend on user ID, not the entire user object
    vulnerabilityId,
    fallbackToPolling,
  ]); // Remove callback dependencies to prevent re-creation

  return {
    isConnected,
    connectionError,
    usePolling,
    canUseRealtime: !!supabase, // Supabase real-time is available
    connectionStatus: isConnected ? 'live' : usePolling ? 'polling' : 'offline',
    lastActivity: new Date().toISOString(),
    connectionAttempts,
    lastConnectionTime,
    connectionHealth: isConnected ? 'excellent' : usePolling ? 'good' : 'poor',
  };
}
