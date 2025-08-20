'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Package } from 'lucide-react';

interface SoftwareData {
  name: string;
  count: number;
}

interface TopAffectedSoftwareProps {
  data: SoftwareData[];
  isLoading?: boolean;
}

export default function TopAffectedSoftware({
  data,
  isLoading = false,
}: TopAffectedSoftwareProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <span>Top Affected Software</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-2 bg-white/10 rounded flex-1"></div>
                <div className="h-4 bg-white/10 rounded w-8"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((item) => item.count));
  const totalVulns = data.reduce((sum, item) => sum + item.count, 0);

  const getSoftwareIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apache') || lowerName.includes('nginx'))
      return '🌐';
    if (lowerName.includes('wordpress') || lowerName.includes('drupal'))
      return '📝';
    if (lowerName.includes('mysql') || lowerName.includes('postgres'))
      return '🗄️';
    if (lowerName.includes('docker') || lowerName.includes('kubernetes'))
      return '📦';
    if (lowerName.includes('node') || lowerName.includes('npm')) return '🟢';
    if (
      lowerName.includes('react') ||
      lowerName.includes('vue') ||
      lowerName.includes('angular')
    )
      return '⚛️';
    if (lowerName.includes('java') || lowerName.includes('spring')) return '☕';
    if (lowerName.includes('python') || lowerName.includes('django'))
      return '🐍';
    if (lowerName.includes('php') || lowerName.includes('laravel')) return '🐘';
    return '📦';
  };

  const getRiskLevel = (count: number) => {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 80)
      return {
        level: 'Critical',
        color: 'text-red-400 bg-red-500/20 border-red-500/30',
      };
    if (percentage >= 60)
      return {
        level: 'High',
        color: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      };
    if (percentage >= 40)
      return {
        level: 'Medium',
        color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      };
    return {
      level: 'Low',
      color: 'text-green-400 bg-green-500/20 border-green-500/30',
    };
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <span>Top Affected Software</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              {data.length} packages
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {totalVulns} vulnerabilities
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/60">
            <Package className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No software data available</p>
            <p className="text-sm">
              Affected software will appear as vulnerabilities are analyzed
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Software List */}
            <div className="space-y-4">
              {data.map((item, index) => {
                const percentage =
                  maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const risk = getRiskLevel(item.count);

                return (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {getSoftwareIcon(item.name)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-indigo-400">
                            #{index + 1}
                          </span>
                          <div className="w-px h-6 bg-white/20"></div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={risk.color}>{risk.level}</Badge>
                            <span className="text-white font-bold">
                              {item.count}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Progress value={percentage} className="h-2" />
                          <div className="flex justify-between text-xs text-white/60">
                            <span>{percentage.toFixed(1)}% of max</span>
                            <span>
                              {((item.count / totalVulns) * 100).toFixed(1)}% of
                              total
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-indigo-400">
                  {data.length}
                </div>
                <div className="text-sm text-white/60">Affected Packages</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  {maxCount}
                </div>
                <div className="text-sm text-white/60">Most Vulnerable</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {data.length > 0 ? Math.round(totalVulns / data.length) : 0}
                </div>
                <div className="text-sm text-white/60">Avg per Package</div>
              </div>
            </div>

            {/* Risk Insights */}
            <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <span className="text-white font-medium">
                  Security Insights
                </span>
              </div>
              <div className="text-sm text-white/80 space-y-1">
                {data.length > 0 && (
                  <>
                    <p>
                      📊 <strong>{data[0].name}</strong> is the most affected
                      with {data[0].count} vulnerabilities
                    </p>
                    {data.length > 1 && (
                      <p>
                        📈 Top 3 packages account for{' '}
                        {Math.round(
                          (data
                            .slice(0, 3)
                            .reduce((sum, item) => sum + item.count, 0) /
                            totalVulns) *
                            100
                        )}
                        % of all vulnerabilities
                      </p>
                    )}
                    <p>
                      🎯 Focus remediation efforts on the top{' '}
                      {Math.min(3, data.length)} packages for maximum impact
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
