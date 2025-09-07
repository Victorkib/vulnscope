'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import AlertRuleForm from './alert-rule-form';
import {
  Plus,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Mail,
  Webhook,
  MessageSquare,
  Hash,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import type { AlertRule } from '@/types/alert';

interface AlertRulesManagerProps {
  className?: string;
}

export default function AlertRulesManager({ className }: AlertRulesManagerProps) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlertRules();
  }, []);

  const fetchAlertRules = async () => {
    try {
      const response = await fetch('/api/alerts/rules', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Error fetching alert rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setRules(prev =>
          prev.map(rule =>
            rule.id === ruleId ? { ...rule, isActive } : rule
          )
        );
        toast({
          title: 'Alert rule updated',
          description: `Rule ${isActive ? 'enabled' : 'disabled'} successfully`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update alert rule',
        variant: 'destructive',
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
        toast({
          title: 'Alert rule deleted',
          description: 'The alert rule has been removed',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert rule',
        variant: 'destructive',
      });
    }
  };

  const handleRuleSuccess = (rule: AlertRule) => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
      setEditingRule(null);
    } else {
      setRules(prev => [rule, ...prev]);
    }
    setShowCreateForm(false);
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingRule(null);
  };

  const getActionIcons = (actions: AlertRule['actions']) => {
    const icons = [];
    if (actions.email) icons.push(<Mail className="h-4 w-4" key="email" />);
    if (actions.push) icons.push(<Bell className="h-4 w-4" key="push" />);
    if (actions.webhook) icons.push(<Webhook className="h-4 w-4" key="webhook" />);
    if (actions.slack) icons.push(<MessageSquare className="h-4 w-4" key="slack" />);
    if (actions.discord) icons.push(<Hash className="h-4 w-4" key="discord" />);
    return icons;
  };

  const getSeverityBadges = (severities?: string[]) => {
    if (!severities || severities.length === 0) return null;
    
    return severities.map(severity => (
      <Badge
        key={severity}
        variant="outline"
        className={
          severity === 'CRITICAL' ? 'border-red-500 text-red-700' :
          severity === 'HIGH' ? 'border-orange-500 text-orange-700' :
          severity === 'MEDIUM' ? 'border-yellow-500 text-yellow-700' :
          'border-green-500 text-green-700'
        }
      >
        {severity}
      </Badge>
    ));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alert Rules</span>
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
    <>
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alert Rules</span>
            <Badge variant="outline">{rules.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Alert Rules
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first alert rule to get notified about new vulnerabilities
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {rule.name}
                        </h3>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {rule.triggerCount > 0 && (
                          <Badge variant="outline">
                            {rule.triggerCount} triggers
                          </Badge>
                        )}
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {rule.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        {/* Conditions */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Conditions:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {getSeverityBadges(rule.conditions.severity)}
                            {rule.conditions.affectedSoftware && (
                              <Badge variant="outline">
                                Software: {rule.conditions.affectedSoftware.join(', ')}
                              </Badge>
                            )}
                            {rule.conditions.cvssScore && (
                              <Badge variant="outline">
                                CVSS: {rule.conditions.cvssScore.min}-{rule.conditions.cvssScore.max}
                              </Badge>
                            )}
                            {rule.conditions.exploitAvailable !== undefined && (
                              <Badge variant="outline">
                                Exploit: {rule.conditions.exploitAvailable ? 'Available' : 'Not Available'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Actions:
                          </h4>
                          <div className="flex items-center space-x-2">
                            {getActionIcons(rule.actions)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(rule.createdAt).toLocaleDateString()}
                        {rule.lastTriggered && (
                          <span className="ml-4">
                            Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Alert Rule Form Dialog */}
    <AlertRuleForm
      isOpen={showCreateForm}
      onClose={handleCloseForm}
      onSuccess={handleRuleSuccess}
      editingRule={editingRule}
    />
  </>
  );
}
