'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bookmark,
  Eye,
  Search,
  Download,
  Bell,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Activity,
  Clock,
} from 'lucide-react';
import { UserStats } from '@/types/user';
import { calculateUserScore } from '@/lib/user-utils';

interface UserStatsCardsProps {
  stats: UserStats;
  isLoading?: boolean;
}

export default function UserStatsCards({
  stats,
  isLoading,
}: UserStatsCardsProps) {
  const userScore = calculateUserScore(stats);

  const statCards = [
    {
      title: 'Bookmarks',
      value: stats.totalBookmarks,
      icon: Bookmark,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-100',
      description: 'Saved vulnerabilities',
      trend: stats.totalBookmarks > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-100',
      description: 'Vulnerabilities viewed',
      trend: stats.totalViews > 10 ? 'up' : 'neutral',
    },
    {
      title: 'Searches',
      value: stats.totalSearches,
      icon: Search,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-100',
      description: 'Search queries',
      trend: stats.totalSearches > 5 ? 'up' : 'neutral',
    },
    {
      title: 'Exports',
      value: stats.totalExports,
      icon: Download,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-100',
      description: 'Data exports',
      trend: stats.totalExports > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: Bell,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-100',
      description: 'Monitoring alerts',
      trend: stats.activeAlerts > 0 ? 'up' : 'neutral',
    },
    {
      title: 'User Score',
      value: userScore,
      icon: Award,
      color: 'from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-100',
      description: 'Engagement score',
      trend: userScore > 50 ? 'up' : userScore > 25 ? 'neutral' : 'down',
      showProgress: true,
      maxValue: 100,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon =
          card.trend === 'up'
            ? TrendingUp
            : card.trend === 'down'
            ? TrendingDown
            : Activity;

        return (
          <Card
            key={index}
            className={`border-0 shadow-lg bg-gradient-to-br ${card.color} text-white transform hover:scale-105 transition-all duration-200`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span className={`text-sm font-medium ${card.textColor}`}>
                    {card.title}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendIcon className={`h-4 w-4 ${card.textColor}`} />
                  {card.trend !== 'neutral' && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        card.trend === 'up'
                          ? 'bg-white/20 text-white'
                          : card.trend === 'down'
                          ? 'bg-red-500/20 text-red-100'
                          : 'bg-gray-500/20 text-gray-100'
                      }`}
                    >
                      {card.trend === 'up'
                        ? 'Good'
                        : card.trend === 'down'
                        ? 'Low'
                        : 'OK'}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-end space-x-2">
                  <span className="text-3xl font-bold text-white">
                    {card.value}
                  </span>
                  {card.maxValue && (
                    <span className={`text-sm mb-1 ${card.textColor}`}>
                      /{card.maxValue}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${card.textColor}`}>
                  {card.description}
                </p>

                {card.showProgress && card.maxValue && (
                  <div className="mt-3">
                    <Progress
                      value={(card.value / card.maxValue) * 100}
                      className="h-2 bg-white/20"
                    />
                    <div className="flex justify-between text-xs mt-1 text-white/80">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional stats for specific cards */}
              {card.title === 'Bookmarks' && stats.totalBookmarks > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center space-x-2 text-xs text-white/80">
                    <Target className="h-3 w-3" />
                    <span>Most viewed: {stats.mostViewedSeverity}</span>
                  </div>
                </div>
              )}

              {card.title === 'Views' && stats.averageSessionTime > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center space-x-2 text-xs text-white/80">
                    <Clock className="h-3 w-3" />
                    <span>
                      Avg session: {Math.round(stats.averageSessionTime)}m
                    </span>
                  </div>
                </div>
              )}

              {card.title === 'User Score' && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-xs text-white/80">
                    {userScore >= 80
                      ? '🏆 Security Expert'
                      : userScore >= 60
                      ? '🥇 Advanced User'
                      : userScore >= 40
                      ? '🥈 Active User'
                      : userScore >= 20
                      ? '🥉 Getting Started'
                      : '👋 New User'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Weekly Activity Summary Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white md:col-span-2 lg:col-span-3">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Weekly Activity Summary
                </h3>
                <p className="text-teal-100">
                  Your security research activity this week
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.weeklyActivity}</div>
              <div className="text-sm text-teal-100">total actions</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(stats.weeklyActivity * 0.4)}
              </div>
              <div className="text-xs text-teal-100">Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(stats.weeklyActivity * 0.3)}
              </div>
              <div className="text-xs text-teal-100">Searches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(stats.weeklyActivity * 0.2)}
              </div>
              <div className="text-xs text-teal-100">Bookmarks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(stats.weeklyActivity * 0.1)}
              </div>
              <div className="text-xs text-teal-100">Exports</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
