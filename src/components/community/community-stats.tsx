'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/utils';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Shield,
  Star,
  Crown,
} from 'lucide-react';
import type { CommunityStats } from '@/types/community';

interface CommunityStatsProps {
  vulnerabilityId?: string;
}

export default function CommunityStats({ vulnerabilityId }: CommunityStatsProps) {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = vulnerabilityId 
          ? `/api/community/stats?vulnerabilityId=${vulnerabilityId}`
          : '/api/community/stats';
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching community stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [vulnerabilityId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Community Activity</span>
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

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Community Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No community activity yet</p>
        </CardContent>
      </Card>
    );
  }

  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'expertise':
        return <Shield className="h-3 w-3" />;
      case 'leadership':
        return <Crown className="h-3 w-3" />;
      case 'helpfulness':
        return <Star className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Community Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalComments}
              </div>
              <div className="text-sm text-gray-600">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalVotes}
              </div>
              <div className="text-sm text-gray-600">Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.activeUsers}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.topContributors.length}
              </div>
              <div className="text-sm text-gray-600">Top Contributors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      {stats.topContributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Top Contributors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topContributors.slice(0, 5).map((contributor, index) => (
                <div
                  key={contributor.userId}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                        {contributor.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {contributor.displayName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {contributor.commentsCount} comments
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {contributor.reputation} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 10).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                >
                  <div className="flex items-center space-x-2">
                    {activity.type === 'comment' && (
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === 'vote' && (
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                    )}
                    {activity.type === 'reply' && (
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {activity.displayName}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {activity.type === 'comment' && 'commented on'}
                      {activity.type === 'vote' && 'voted on'}
                      {activity.type === 'reply' && 'replied to'}
                    </span>
                    <span className="text-gray-500 ml-1">
                      {activity.data.vulnerabilityId || 'a vulnerability'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
