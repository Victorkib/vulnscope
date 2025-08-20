'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  Bookmark,
  Eye,
  MessageSquare,
  Search,
  Download,
  Bell,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { formatActivityDescription, getActivityColor } from '@/lib/user-utils';
import { formatRelativeTime } from '@/lib/date-utils';
import { UserActivity } from '@/types/user';

interface ActivityFeedProps {
  activities: UserActivity[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const iconMap = {
  bookmark: Bookmark,
  view: Eye,
  comment: MessageSquare,
  search: Search,
  export: Download,
  alert_created: Bell,
  settings_changed: Settings,
};

export default function ActivityFeed({
  activities,
  isLoading,
  onRefresh,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    return activity.type === filter;
  });

  const displayedActivities = showAll
    ? filteredActivities
    : filteredActivities.slice(0, 10);

  const activityTypes = [
    { value: 'all', label: 'All Activity', count: activities.length },
    {
      value: 'bookmark',
      label: 'Bookmarks',
      count: activities.filter((a) => a.type === 'bookmark').length,
    },
    {
      value: 'view',
      label: 'Views',
      count: activities.filter((a) => a.type === 'view').length,
    },
    {
      value: 'search',
      label: 'Searches',
      count: activities.filter((a) => a.type === 'search').length,
    },
    {
      value: 'export',
      label: 'Exports',
      count: activities.filter((a) => a.type === 'export').length,
    },
  ];

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Recent Activity</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>

        {/* Activity Type Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {activityTypes.map((type) => (
            <Button
              key={type.value}
              variant={filter === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type.value)}
              className="flex items-center space-x-1"
            >
              <span>{type.label}</span>
              {type.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {type.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {displayedActivities.length > 0 ? (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {displayedActivities.map((activity) => {
                const IconComponent =
                  iconMap[activity.type as keyof typeof iconMap] || Activity;
                const colorClass = getActivityColor(activity.type);

                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                  >
                    <div
                      className={`p-2 rounded-full bg-white shadow-sm ${colorClass}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {formatActivityDescription(activity)}
                          </p>
                          {activity.metadata && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {Object.entries(activity.metadata).map(
                                ([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {key}: {String(value)}
                                  </Badge>
                                )
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`ml-2 text-xs ${
                            activity.type === 'bookmark'
                              ? 'border-blue-200 text-blue-700'
                              : activity.type === 'view'
                              ? 'border-green-200 text-green-700'
                              : activity.type === 'search'
                              ? 'border-orange-200 text-orange-700'
                              : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No activity yet' : `No ${filter} activity`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'Your activity will appear here as you use the platform'
                : `Start ${
                    filter === 'bookmark'
                      ? 'bookmarking vulnerabilities'
                      : `${filter}ing`
                  } to see activity here`}
            </p>
          </div>
        )}

        {filteredActivities.length > 10 && !showAll && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setShowAll(true)}>
              Show All {filteredActivities.length} Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
