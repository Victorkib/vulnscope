'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Target,
  BarChart3,
  PieChartIcon,
  Info,
  Zap,
} from 'lucide-react';

interface SeverityData {
  severity: string;
  count: number;
  percentage: number;
  color: string;
  riskLevel: string;
  avgCvss: number;
  trend: 'up' | 'down' | 'stable';
}

interface SeverityDistributionProps {
  data: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  isLoading?: boolean;
  showInsights?: boolean;
  interactive?: boolean;
}

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626', // red-600
  HIGH: '#ea580c', // orange-600
  MEDIUM: '#d97706', // amber-600
  LOW: '#65a30d', // lime-600
};

const SEVERITY_CONFIG = {
  CRITICAL: {
    riskLevel: 'Extreme',
    avgCvss: 9.2,
    trend: 'up' as const,
    description: 'Immediate action required',
  },
  HIGH: {
    riskLevel: 'High',
    avgCvss: 7.8,
    trend: 'stable' as const,
    description: 'Urgent attention needed',
  },
  MEDIUM: {
    riskLevel: 'Moderate',
    avgCvss: 5.4,
    trend: 'down' as const,
    description: 'Plan remediation',
  },
  LOW: {
    riskLevel: 'Low',
    avgCvss: 2.1,
    trend: 'stable' as const,
    description: 'Monitor and assess',
  },
};

export default function SeverityDistribution({
  data,
  isLoading = false,
  showInsights = true,
  interactive = true,
}: SeverityDistributionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'percentage' | 'count'>(
    'percentage'
  );

  // Safely handle undefined/null data
  const safeData = useMemo(
    () =>
      data || {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
    [data]
  );

  const chartData = useMemo(() => {
    const total = Object.values(safeData).reduce(
      (sum, count) => sum + count,
      0
    );

    return Object.entries(safeData).map(([severity, count]) => ({
      severity,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS],
      ...SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG],
    }));
  }, [safeData]);

  const totalVulnerabilities = useMemo(
    () => Object.values(safeData).reduce((sum, count) => sum + count, 0),
    [safeData]
  );

  const riskScore = useMemo(() => {
    const weights = { CRITICAL: 10, HIGH: 7, MEDIUM: 4, LOW: 1 };
    const weightedSum = Object.entries(safeData).reduce(
      (sum, [severity, count]) =>
        sum + count * weights[severity as keyof typeof weights],
      0
    );
    return totalVulnerabilities > 0
      ? Math.round((weightedSum / totalVulnerabilities) * 10)
      : 0;
  }, [safeData, totalVulnerabilities]);

  const getRiskLevel = (score: number) => {
    if (score >= 80)
      return { level: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
    if (score >= 60)
      return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (score >= 40)
      return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const riskAssessment = getRiskLevel(riskScore);

  const onPieEnter = (_: any, index: number) => {
    if (interactive) {
      setActiveIndex(index);
    }
  };

  const onPieLeave = () => {
    if (interactive) {
      setActiveIndex(null);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-gray-900">{data.severity}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div>
              Count: <span className="font-medium">{data.count}</span>
            </div>
            <div>
              Percentage:{' '}
              <span className="font-medium">{data.percentage}%</span>
            </div>
            <div>
              Risk Level: <span className="font-medium">{data.riskLevel}</span>
            </div>
            <div>
              Avg CVSS: <span className="font-medium">{data.avgCvss}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5 text-indigo-500" />
            <CardTitle>Severity Distribution</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('percentage')}
            >
              %
            </Button>
            <Button
              variant={viewMode === 'count' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('count')}
            >
              #
            </Button>
          </div>
        </div>
        <CardDescription>
          Analysis of {totalVulnerabilities} vulnerabilities by severity level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart" className="flex items-center space-x-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Chart View</span>
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Detailed View</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomLabel}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey={viewMode}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={activeIndex === index ? '#374151' : 'none'}
                          strokeWidth={activeIndex === index ? 2 : 0}
                          style={{
                            filter:
                              activeIndex === index
                                ? 'brightness(1.1)'
                                : 'none',
                            cursor: interactive ? 'pointer' : 'default',
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Risk Score */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {riskScore}
                    </div>
                    <div
                      className={`text-sm font-medium ${riskAssessment.color}`}
                    >
                      {riskAssessment.level} Risk
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend and Stats */}
              <div className="space-y-4">
                <div className="space-y-3">
                  {chartData.map((item, index) => (
                    <div
                      key={item.severity}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        activeIndex === index
                          ? 'border-gray-300 bg-gray-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ cursor: interactive ? 'pointer' : 'default' }}
                      onClick={() =>
                        interactive &&
                        setActiveIndex(activeIndex === index ? null : index)
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.severity}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {viewMode === 'percentage'
                            ? `${item.percentage}%`
                            : item.count}
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <span>CVSS {item.avgCvss}</span>
                          {item.trend === 'up' && (
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          )}
                          {item.trend === 'down' && (
                            <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            {showInsights && (
              <div
                className={`p-4 rounded-lg ${riskAssessment.bg} border border-gray-200`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {riskScore >= 80 ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : riskScore >= 60 ? (
                      <Shield className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Target className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${riskAssessment.color}`}>
                      {riskAssessment.level} Risk Environment
                    </h4>
                    <p className="text-sm text-gray-700 mt-1">
                      {riskScore >= 80 &&
                        'Your environment has a high concentration of critical vulnerabilities. Immediate action is required to reduce risk exposure.'}
                      {riskScore >= 60 &&
                        riskScore < 80 &&
                        'Your environment has several high-severity vulnerabilities that need urgent attention.'}
                      {riskScore >= 40 &&
                        riskScore < 60 &&
                        'Your environment has a moderate risk profile. Focus on addressing high and critical vulnerabilities.'}
                      {riskScore < 40 &&
                        'Your environment has a relatively low risk profile. Continue monitoring and maintain good security practices.'}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Risk Score</span>
                        <span className="font-medium">{riskScore}/100</span>
                      </div>
                      <Progress value={riskScore} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chartData.map((item) => (
                <Card
                  key={item.severity}
                  className="border-l-4"
                  style={{ borderLeftColor: item.color }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.severity}
                        </Badge>
                        {item.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                        {item.trend === 'down' && (
                          <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {item.count}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.percentage}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Level:</span>
                        <span className="font-medium">{item.riskLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg CVSS:</span>
                        <span className="font-medium">{item.avgCvss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className="font-medium">{item.description}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress
                        value={(item.count / totalVulnerabilities) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Zap className="h-4 w-4" />
                <span>Focus on Critical</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Target className="h-4 w-4" />
                <span>Create Alert</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Info className="h-4 w-4" />
                <span>Export Report</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
