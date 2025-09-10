'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePreferences } from '@/contexts/preferences-context';
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
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import AlertRulesManager from '@/components/alerts/alert-rules-manager';
import TeamManager from '@/components/collaboration/team-manager';
import InvitationManager from '@/components/collaboration/invitation-manager';
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
  Eye,
  Volume2,
  VolumeX,
  Globe,
  Clock,
  Type,
  Layout,
  Zap,
  AlertTriangle,
  FileText,
  Database,
  Monitor,
  Smartphone,
  Tablet,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  Sliders,
  Target,
  Activity,
} from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Use the centralized preferences hook
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    saving,
    updatePreference,
    savePreferences,
    resetToDefaults,
  } = usePreferences();

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

  // Use preferences directly (unified hook provides defaults)
  const currentPreferences = preferences;

  const handleSave = async () => {
    try {
      await savePreferences(currentPreferences);
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
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefaults();
      setHasChanges(false);
      toast({
        title: 'Settings Reset',
        description: 'All settings have been reset to defaults.',
      });
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Show loading state while preferences are being fetched
  if (preferencesLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl w-1/3"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Apply user preferences for styling
  const getFontSizeClass = () => {
    switch (preferences?.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getHighContrastClass = () => {
    return preferences?.highContrast ? 'border-2 border-gray-300 dark:border-gray-600' : '';
  };

  const getAnimationClass = () => {
    return preferences?.reduceMotion ? 'transition-none' : 'transition-all duration-200';
  };

  const getLayoutClass = () => {
    switch (preferences?.dashboardLayout) {
      case 'compact': return 'space-y-4';
      case 'spacious': return 'space-y-8';
      default: return 'space-y-6';
    }
  };

  return (
    <AppLayout>
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 ${getFontSizeClass()} ${getAnimationClass()}`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Customize your VulnScope experience
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {hasChanges && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-orange-700 dark:text-orange-300 font-medium text-sm">
                      Unsaved Changes
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Settings Navigation */}
          <Tabs defaultValue="appearance" className={`${getLayoutClass()}`}>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-2">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-transparent h-auto p-0">
                <TabsTrigger
                  value="appearance"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Palette className="w-5 h-5" />
                  <span className="text-xs font-medium">Appearance</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Bell className="w-5 h-5" />
                  <span className="text-xs font-medium">Notifications</span>
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Database className="w-5 h-5" />
                  <span className="text-xs font-medium">Data</span>
                </TabsTrigger>
                <TabsTrigger
                  value="accessibility"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Accessibility className="w-5 h-5" />
                  <span className="text-xs font-medium">Accessibility</span>
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-xs font-medium">Alerts</span>
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-medium">Teams</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-xs font-medium">Security</span>
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-xs font-medium">Advanced</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Theme Selection */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Theme</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Choose your preferred color scheme
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => updatePreference('theme', 'light' as 'light' | 'dark' | 'system')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          currentPreferences?.theme === 'light'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                        <div className="text-sm font-medium">Light</div>
                      </button>
                      <button
                        onClick={() => updatePreference('theme', 'dark' as 'light' | 'dark' | 'system')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          currentPreferences?.theme === 'dark'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <Moon className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                        <div className="text-sm font-medium">Dark</div>
                      </button>
                      <button
                        onClick={() => updatePreference('theme', 'system' as 'light' | 'dark' | 'system')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          currentPreferences?.theme === 'system'
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <Laptop className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                        <div className="text-sm font-medium">System</div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Typography & Layout */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Typography & Layout</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Customize text size and layout density
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Font Size */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <Type className="w-4 h-4" />
                        <span>Font Size</span>
                      </Label>
                      <Select
                        value={currentPreferences?.fontSize || 'medium'}
                        onValueChange={(value) => updatePreference('fontSize', value as 'small' | 'medium' | 'large')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dashboard Layout */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <Layout className="w-4 h-4" />
                        <span>Dashboard Layout</span>
                      </Label>
                      <Select
                        value={currentPreferences?.dashboardLayout || 'comfortable'}
                        onValueChange={(value) => updatePreference('dashboardLayout', value as 'compact' | 'comfortable' | 'spacious')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select layout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visual Options */}
              <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Visual Options</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                        Fine-tune your visual experience
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Show Animations</span>
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Enable smooth transitions and animations
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.showAnimations || false}
                        onCheckedChange={(checked) => updatePreference('showAnimations', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <Layout className="w-4 h-4" />
                          <span>Collapse Sidebar</span>
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Start with sidebar collapsed
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.sidebarCollapsed || false}
                        onCheckedChange={(checked) => updatePreference('sidebarCollapsed', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Notifications */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Email Notifications</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Configure email alert preferences
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Receive vulnerability alerts via email
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.emailNotifications || false}
                        onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Critical Alerts</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Always notify for critical vulnerabilities
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.criticalAlerts || false}
                        onCheckedChange={(checked) => updatePreference('criticalAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Weekly Digest</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Receive weekly vulnerability summaries
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.weeklyDigest || false}
                        onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Push Notifications */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Push Notifications</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Browser and mobile notifications
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Push Notifications</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.pushNotifications || false}
                        onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Sound Notifications</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Play sounds for new notifications
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.enableSounds || false}
                        onCheckedChange={(checked) => updatePreference('enableSounds', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data Settings */}
            <TabsContent value="data" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Settings */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                        <Download className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Export Settings</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Configure data export preferences
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Export Format</span>
                      </Label>
                      <Select
                        value={currentPreferences?.exportFormat || 'csv'}
                        onValueChange={(value) => updatePreference('exportFormat', value as 'json' | 'csv' | 'pdf')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select export format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <Database className="w-4 h-4" />
                        <span>Results Per Page</span>
                      </Label>
                      <Select
                        value={currentPreferences?.maxResultsPerPage?.toString() || '25'}
                        onValueChange={(value) => updatePreference('maxResultsPerPage', parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select page size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Show Preview Cards</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Display vulnerability preview cards
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.showPreviewCards || false}
                        onCheckedChange={(checked) => updatePreference('showPreviewCards', checked)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span>Default Severity Filter</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                          <div key={severity} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`default-severity-${severity}`}
                              checked={(currentPreferences?.defaultSeverityFilter || []).includes(severity)}
                              onChange={(e) => {
                                const current = currentPreferences?.defaultSeverityFilter || [];
                                const newFilter = e.target.checked
                                  ? [...current, severity]
                                  : current.filter(s => s !== severity);
                                updatePreference('defaultSeverityFilter', newFilter);
                              }}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={`default-severity-${severity}`} className="text-sm text-gray-700 dark:text-gray-300">
                              {severity}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Auto Refresh */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Auto Refresh</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Automatic data updates
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Auto Refresh</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Automatically refresh vulnerability data
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.autoRefresh || false}
                        onCheckedChange={(checked) => updatePreference('autoRefresh', checked)}
                      />
                    </div>

                    {currentPreferences?.autoRefresh && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Refresh Interval</span>
                        </Label>
                        <div className="px-4">
                          <Slider
                            value={[currentPreferences?.refreshInterval || 300000]}
                            onValueChange={(value) => updatePreference('refreshInterval', value[0])}
                            max={3600000}
                            min={60000}
                            step={60000}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>1 min</span>
                            <span className="font-medium">
                              {Math.round((currentPreferences?.refreshInterval || 300000) / 60000)} min
                            </span>
                            <span>60 min</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Accessibility Settings */}
            <TabsContent value="accessibility" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Accessibility */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Visual Accessibility</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Enhance visual clarity and contrast
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">High Contrast</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Increase contrast for better visibility
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.highContrast || false}
                        onCheckedChange={(checked) => updatePreference('highContrast', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Reduce Motion</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Minimize animations and transitions
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.reduceMotion || false}
                        onCheckedChange={(checked) => updatePreference('reduceMotion', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Language & Region */}
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Language & Region</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Localization and timezone settings
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Language</span>
                      </Label>
                      <Select
                        value={currentPreferences?.language || 'en'}
                        onValueChange={(value) => updatePreference('language', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Timezone</span>
                      </Label>
                      <Select
                        value={currentPreferences?.timezone || 'UTC'}
                        onValueChange={(value) => updatePreference('timezone', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Screen Reader</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Optimize for screen readers
                        </p>
                      </div>
                      <Switch
                        checked={currentPreferences?.screenReader || false}
                        onCheckedChange={(checked) => updatePreference('screenReader', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Alerts Settings */}
            <TabsContent value="alerts" className="space-y-6">
              <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Alert Rules</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                        Create and manage custom alert rules for vulnerability notifications
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertRulesManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teams Settings */}
            <TabsContent value="teams" className="space-y-6">
              {/* Pending Invitations */}
              <InvitationManager className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`} />
              
              {/* Team Management */}
              <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Team Management</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                        Create and manage teams for collaborative vulnerability research
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Security Settings</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          Configure security preferences
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Security Settings
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Security configuration options will be available here
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-semibold">Activity Log</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          View account activity and security events
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Activity Log
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Account activity tracking will be available here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6">
              <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${getHighContrastClass()}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                      <Sliders className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">Advanced Settings</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                        Advanced configuration and debugging options
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Sliders className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Advanced Settings
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Advanced configuration options will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}