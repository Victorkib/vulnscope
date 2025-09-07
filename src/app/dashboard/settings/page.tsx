'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-api';
import AppLayout from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AlertRulesManager from '@/components/alerts/alert-rules-manager';
import TestAlertButton from '@/components/test/test-alert-button';
import TeamManager from '@/components/collaboration/team-manager';
import {
  Settings,
  Bell,
  Shield,
  Download,
  Palette,
  Sun,
  Moon,
  Laptop,
  Save,
  RefreshCw,
  Check,
  Accessibility,
  Users,
} from 'lucide-react';

export default function SettingsPage() {
  const { preferences: themePreferences, updatePreference, isDarkMode: _isDarkMode } =
    useTheme();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Use the optimized preferences hook
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    savePreferences,
  } = useUserPreferences();

  useEffect(() => {
    // Track if there are unsaved changes
    setHasChanges(true);
  }, [preferences]);

  // Handle preferences errors
  useEffect(() => {
    if (preferencesError) {
      toast({
        title: 'Error',
        description: 'Failed to load user preferences. Using default settings.',
        variant: 'destructive',
      });
    }
  }, [preferencesError, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePreferences(preferences);
      setHasChanges(false);
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to defaults would go here
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults.',
    });
  };

  if (!preferences) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <span>Settings</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Customize your VulnScope experience and preferences
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              >
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
            <TabsTrigger
              value="appearance"
              className="flex items-center space-x-2"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center space-x-2"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger
              value="accessibility"
              className="flex items-center space-x-2"
            >
              <Accessibility className="w-4 h-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <span>Appearance & Theme</span>
                </CardTitle>
                <CardDescription>
                  Customize how VulnScope looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Laptop },
                    ].map((theme) => (
                      <Button
                        key={theme.value}
                        variant={
                          preferences.theme === theme.value
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => updatePreference('theme', theme.value)}
                      >
                        <theme.icon className="w-6 h-6" />
                        <span>{theme.label}</span>
                        {preferences.theme === theme.value && (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Font Size */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Font Size</Label>
                  <Select
                    value={preferences.fontSize}
                    onValueChange={(value) =>
                      updatePreference('fontSize', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (14px)</SelectItem>
                      <SelectItem value="medium">Medium (16px)</SelectItem>
                      <SelectItem value="large">Large (18px)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Changes will apply immediately across the entire application
                  </p>
                </div>

                {/* Dashboard Layout */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Dashboard Layout
                  </Label>
                  <Select
                    value={preferences.dashboardLayout}
                    onValueChange={(value) =>
                      updatePreference('dashboardLayout', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">
                        Compact - Minimal spacing
                      </SelectItem>
                      <SelectItem value="comfortable">
                        Comfortable - Balanced spacing
                      </SelectItem>
                      <SelectItem value="spacious">
                        Spacious - Maximum spacing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Animation Settings */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Enable Animations
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showAnimations}
                    onCheckedChange={(checked) =>
                      updatePreference('showAnimations', checked)
                    }
                  />
                </div>

                {/* Sidebar Settings */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Collapse Sidebar
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Start with sidebar collapsed
                    </p>
                  </div>
                  <Switch
                    checked={preferences.sidebarCollapsed}
                    onCheckedChange={(checked) =>
                      updatePreference('sidebarCollapsed', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      updatePreference('emailNotifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) =>
                      updatePreference('pushNotifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Critical Alerts
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Always notify for critical vulnerabilities
                    </p>
                  </div>
                  <Switch
                    checked={preferences.criticalAlerts}
                    onCheckedChange={(checked) =>
                      updatePreference('criticalAlerts', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Weekly Digest
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive weekly summary reports
                    </p>
                  </div>
                  <Switch
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) =>
                      updatePreference('weeklyDigest', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Sound Notifications
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Play sounds for notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableSounds}
                    onCheckedChange={(checked) =>
                      updatePreference('enableSounds', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Security & Privacy</span>
                </CardTitle>
                <CardDescription>
                  Manage your security preferences and data privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Auto Refresh
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically refresh vulnerability data
                    </p>
                  </div>
                  <Switch
                    checked={preferences.autoRefresh}
                    onCheckedChange={(checked) =>
                      updatePreference('autoRefresh', checked)
                    }
                  />
                </div>

                {preferences.autoRefresh && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      Refresh Interval
                    </Label>
                    <Select
                      value={preferences.refreshInterval.toString()}
                      onValueChange={(value) =>
                        updatePreference(
                          'refreshInterval',
                          Number.parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60000">1 minute</SelectItem>
                        <SelectItem value="300000">5 minutes</SelectItem>
                        <SelectItem value="600000">10 minutes</SelectItem>
                        <SelectItem value="1800000">30 minutes</SelectItem>
                        <SelectItem value="3600000">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Default Severity Filter
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose which severity levels to show by default
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                      <div
                        key={severity}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={severity}
                          checked={preferences.defaultSeverityFilter.includes(
                            severity
                          )}
                          onChange={(e) => {
                            const current = preferences.defaultSeverityFilter;
                            if (e.target.checked) {
                              updatePreference('defaultSeverityFilter', [
                                ...current,
                                severity,
                              ]);
                            } else {
                              updatePreference(
                                'defaultSeverityFilter',
                                current.filter((s) => s !== severity)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label
                          htmlFor={severity}
                          className="text-sm font-medium"
                        >
                          {severity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-orange-600" />
                  <span>Data & Export</span>
                </CardTitle>
                <CardDescription>
                  Configure data handling and export preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Default Export Format
                  </Label>
                  <Select
                    value={preferences.exportFormat}
                    onValueChange={(value) =>
                      updatePreference('exportFormat', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Results Per Page
                  </Label>
                  <Select
                    value={preferences.maxResultsPerPage.toString()}
                    onValueChange={(value) =>
                      updatePreference(
                        'maxResultsPerPage',
                        Number.parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Show Preview Cards
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Display preview cards in vulnerability lists
                    </p>
                  </div>
                  <Switch
                    checked={preferences.showPreviewCards}
                    onCheckedChange={(checked) =>
                      updatePreference('showPreviewCards', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Accessibility className="w-5 h-5 text-indigo-600" />
                  <span>Accessibility</span>
                </CardTitle>
                <CardDescription>
                  Customize accessibility features for better usability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      updatePreference('language', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      updatePreference('timezone', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      High Contrast Mode
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Increase color contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    checked={preferences.highContrast}
                    onCheckedChange={(checked) =>
                      updatePreference('highContrast', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Reduce Motion
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={preferences.reduceMotion}
                    onCheckedChange={(checked) =>
                      updatePreference('reduceMotion', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Screen Reader Optimization
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optimize interface for screen readers
                    </p>
                  </div>
                  <Switch
                    checked={preferences.screenReader}
                    onCheckedChange={(checked) =>
                      updatePreference('screenReader', checked)
                    }
                  />
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Accessibility className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200">
                        Accessibility Features
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        These settings will immediately apply across the entire
                        application to improve accessibility and usability.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-red-600" />
                  <span>Advanced Settings</span>
                </CardTitle>
                <CardDescription>
                  Advanced configuration options for power users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Warning
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        These settings are for advanced users only. Changing
                        these values may affect system performance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    disabled
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    disabled
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    disabled
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Reset All Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alert Rules Settings */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Alert Rules
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Configure custom alerts for vulnerability notifications
                </p>
              </div>
              <TestAlertButton />
            </div>
            <AlertRulesManager />
          </TabsContent>

          {/* Teams Settings */}
          <TabsContent value="teams" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Management
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Create and manage teams for collaborative vulnerability research
              </p>
            </div>
            <TeamManager />
          </TabsContent>
        </Tabs>

        {/* Save Banner */}
        {hasChanges && (
          <Card className="border-0 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    You have unsaved changes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
