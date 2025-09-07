'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Plus,
  X,
  Mail,
  Bell,
  Webhook,
  MessageSquare,
  Hash,
} from 'lucide-react';
import type { AlertRule, AlertConditions, AlertActions } from '@/types/alert';

interface AlertRuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rule: AlertRule) => void;
  editingRule?: AlertRule | null;
}

export default function AlertRuleForm({
  isOpen,
  onClose,
  onSuccess,
  editingRule,
}: AlertRuleFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingRule?.name || '',
    description: editingRule?.description || '',
    conditions: {
      severity: editingRule?.conditions.severity || [],
      affectedSoftware: editingRule?.conditions.affectedSoftware || [],
      cvssScore: editingRule?.conditions.cvssScore || { min: 0, max: 10 },
      tags: editingRule?.conditions.tags || [],
      exploitAvailable: editingRule?.conditions.exploitAvailable,
      patchAvailable: editingRule?.conditions.patchAvailable,
      kev: editingRule?.conditions.kev,
    } as AlertConditions,
    actions: {
      email: editingRule?.actions.email || false,
      push: editingRule?.actions.push || false,
      webhook: editingRule?.actions.webhook || undefined,
      slack: editingRule?.actions.slack || undefined,
      discord: editingRule?.actions.discord || undefined,
    } as AlertActions,
    cooldownMinutes: editingRule?.cooldownMinutes || 60,
  });

  const [newSoftware, setNewSoftware] = useState('');
  const [newTag, setNewTag] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(editingRule?.actions.webhook?.url || '');
  const [slackWebhook, setSlackWebhook] = useState(editingRule?.actions.slack?.webhookUrl || '');
  const [discordWebhook, setDiscordWebhook] = useState(editingRule?.actions.discord?.webhookUrl || '');

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Alert rule name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.actions.email && !formData.actions.push && !webhookUrl && !slackWebhook && !discordWebhook) {
      toast({
        title: 'Error',
        description: 'At least one action must be selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare actions with webhook URLs
      const actions: AlertActions = {
        email: formData.actions.email,
        push: formData.actions.push,
      };

      if (webhookUrl) {
        actions.webhook = {
          url: webhookUrl,
          method: 'POST',
        };
      }

      if (slackWebhook) {
        actions.slack = {
          webhookUrl: slackWebhook,
        };
      }

      if (discordWebhook) {
        actions.discord = {
          webhookUrl: discordWebhook,
        };
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        conditions: formData.conditions,
        actions,
        cooldownMinutes: formData.cooldownMinutes,
      };

      const url = editingRule 
        ? `/api/alerts/rules/${editingRule.id}`
        : '/api/alerts/rules';
      
      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const rule = await response.json();
        onSuccess(rule);
        onClose();
        toast({
          title: 'Success',
          description: editingRule 
            ? 'Alert rule updated successfully' 
            : 'Alert rule created successfully',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save alert rule');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save alert rule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addSoftware = () => {
    if (newSoftware.trim() && !formData.conditions.affectedSoftware.includes(newSoftware.trim())) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          affectedSoftware: [...prev.conditions.affectedSoftware, newSoftware.trim()],
        },
      }));
      setNewSoftware('');
    }
  };

  const removeSoftware = (software: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        affectedSoftware: prev.conditions.affectedSoftware.filter(s => s !== software),
      },
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.conditions.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          tags: [...prev.conditions.tags, newTag.trim()],
        },
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        tags: prev.conditions.tags.filter(t => t !== tag),
      },
    }));
  };

  const toggleSeverity = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        severity: prev.conditions.severity.includes(severity)
          ? prev.conditions.severity.filter(s => s !== severity)
          : [...prev.conditions.severity, severity],
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingRule 
              ? 'Update your alert rule configuration'
              : 'Set up custom alerts for vulnerability notifications'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Critical Vulnerabilities Alert"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of this alert rule"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Severity */}
              <div>
                <Label>Severity Levels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                    <Badge
                      key={severity}
                      variant={formData.conditions.severity.includes(severity as any) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSeverity(severity as any)}
                    >
                      {severity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CVSS Score */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cvss-min">Minimum CVSS Score</Label>
                  <Input
                    id="cvss-min"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.conditions.cvssScore.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        cvssScore: { ...prev.conditions.cvssScore, min: parseFloat(e.target.value) || 0 },
                      },
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cvss-max">Maximum CVSS Score</Label>
                  <Input
                    id="cvss-max"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.conditions.cvssScore.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        cvssScore: { ...prev.conditions.cvssScore, max: parseFloat(e.target.value) || 10 },
                      },
                    }))}
                  />
                </div>
              </div>

              {/* Affected Software */}
              <div>
                <Label>Affected Software</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSoftware}
                    onChange={(e) => setNewSoftware(e.target.value)}
                    placeholder="e.g., Apache, nginx, WordPress"
                    onKeyPress={(e) => e.key === 'Enter' && addSoftware()}
                  />
                  <Button type="button" onClick={addSoftware} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.conditions.affectedSoftware.map((software) => (
                    <Badge key={software} variant="secondary" className="flex items-center gap-1">
                      {software}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSoftware(software)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="e.g., rce, xss, sql-injection"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.conditions.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Boolean Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Exploit Available</Label>
                  <Select
                    value={formData.conditions.exploitAvailable?.toString() || 'any'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        exploitAvailable: value === 'any' ? undefined : value === 'true',
                      },
                    }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Patch Available</Label>
                  <Select
                    value={formData.conditions.patchAvailable?.toString() || 'any'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        patchAvailable: value === 'any' ? undefined : value === 'true',
                      },
                    }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Known Exploited Vulnerabilities (KEV)</Label>
                  <Select
                    value={formData.conditions.kev?.toString() || 'any'}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      conditions: {
                        ...prev.conditions,
                        kev: value === 'any' ? undefined : value === 'true',
                      },
                    }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <Label>Email Notification</Label>
                </div>
                <Switch
                  checked={formData.actions.email}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    actions: { ...prev.actions, email: checked },
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <Label>Push Notification</Label>
                </div>
                <Switch
                  checked={formData.actions.push}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    actions: { ...prev.actions, push: checked },
                  }))}
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Webhook className="h-4 w-4" />
                  <Label>Webhook URL</Label>
                </div>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-webhook-url.com/endpoint"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <Label>Slack Webhook URL</Label>
                </div>
                <Input
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Hash className="h-4 w-4" />
                  <Label>Discord Webhook URL</Label>
                </div>
                <Input
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Cooldown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cooldown Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="cooldown">Cooldown Period (minutes)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.cooldownMinutes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    cooldownMinutes: parseInt(e.target.value) || 60,
                  }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum time between alerts for the same rule (1-1440 minutes)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
