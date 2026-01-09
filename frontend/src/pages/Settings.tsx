import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Shield,
  Zap,
  Paintbrush,
  Bug,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Save,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import { settingsApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { cn } from '../utils/helpers';
import { ReviewSettings, IssueCategory, IssueSeverity } from '../types';

const categoryConfig = {
  security: { icon: Shield, label: 'Security', color: 'text-coral-400' },
  performance: { icon: Zap, label: 'Performance', color: 'text-amber-400' },
  style: { icon: Paintbrush, label: 'Style', color: 'text-purple-400' },
  bug: { icon: Bug, label: 'Bugs', color: 'text-red-400' },
  best_practice: { icon: CheckCircle, label: 'Best Practices', color: 'text-emerald-400' },
  other: { icon: AlertCircle, label: 'Other', color: 'text-ocean-400' },
};

const severityConfig = {
  critical: { icon: AlertTriangle, label: 'Critical', color: 'text-coral-400' },
  warning: { icon: AlertCircle, label: 'Warning', color: 'text-amber-400' },
  info: { icon: Info, label: 'Info', color: 'text-ocean-400' },
};

export default function Settings() {
  const queryClient = useQueryClient();
  
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsApi.get();
      return response.data.data as ReviewSettings;
    },
  });

  const [settings, setSettings] = useState<ReviewSettings | null>(null);
  const [newIgnoredFile, setNewIgnoredFile] = useState('');
  const [newIgnoredPattern, setNewIgnoredPattern] = useState('');

  // Initialize settings when data loads
  if (settingsData && !settings) {
    setSettings(settingsData);
  }

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Partial<ReviewSettings>) => {
      const response = await settingsApi.update(newSettings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await settingsApi.reset();
      return response.data.data as ReviewSettings;
    },
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings reset to defaults');
    },
    onError: () => {
      toast.error('Failed to reset settings');
    },
  });

  const handleSave = () => {
    if (settings) {
      updateMutation.mutate(settings);
    }
  };

  const toggleCategory = (category: IssueCategory) => {
    if (!settings) return;
    
    const newCategories = settings.enabledCategories.includes(category)
      ? settings.enabledCategories.filter((c) => c !== category)
      : [...settings.enabledCategories, category];
    
    setSettings({ ...settings, enabledCategories: newCategories });
  };

  const addIgnoredFile = () => {
    if (!settings || !newIgnoredFile.trim()) return;
    
    setSettings({
      ...settings,
      ignoredFiles: [...settings.ignoredFiles, newIgnoredFile.trim()],
    });
    setNewIgnoredFile('');
  };

  const removeIgnoredFile = (file: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      ignoredFiles: settings.ignoredFiles.filter((f) => f !== file),
    });
  };

  const addIgnoredPattern = () => {
    if (!settings || !newIgnoredPattern.trim()) return;
    
    setSettings({
      ...settings,
      ignoredPatterns: [...settings.ignoredPatterns, newIgnoredPattern.trim()],
    });
    setNewIgnoredPattern('');
  };

  const removeIgnoredPattern = (pattern: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      ignoredPatterns: settings.ignoredPatterns.filter((p) => p !== pattern),
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ocean-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-ocean-400 mt-1">Configure your code review preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => resetMutation.mutate()}
            isLoading={resetMutation.isPending}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-ocean-400" />
              Review Categories
            </CardTitle>
            <CardDescription>
              Select which types of issues should be analyzed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(Object.entries(categoryConfig) as [IssueCategory, typeof categoryConfig.security][]).map(
                ([key, config]) => {
                  const isEnabled = settings.enabledCategories.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      className={cn(
                        'p-4 rounded-lg border transition-all duration-200 text-left',
                        isEnabled
                          ? 'bg-ocean-900/30 border-ocean-600/50'
                          : 'bg-surface-tertiary/50 border-ocean-900/50 opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <config.icon className={cn('w-5 h-5', config.color)} />
                        <span className="font-medium text-white">{config.label}</span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Severity Threshold */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Severity Threshold</CardTitle>
            <CardDescription>
              Set the minimum severity level for reported issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {(Object.entries(severityConfig) as [IssueSeverity, typeof severityConfig.critical][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSettings({ ...settings, severityThreshold: key })}
                    className={cn(
                      'flex-1 p-4 rounded-lg border transition-all duration-200',
                      settings.severityThreshold === key
                        ? 'bg-ocean-900/30 border-ocean-600/50'
                        : 'bg-surface-tertiary/50 border-ocean-900/50 opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <config.icon className={cn('w-5 h-5', config.color)} />
                      <span className="font-medium text-white">{config.label}</span>
                    </div>
                  </button>
                )
              )}
            </div>
            <p className="text-sm text-ocean-400 mt-4">
              Issues with severity lower than "{settings.severityThreshold}" will not be reported.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ignored Files */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ignored Files</CardTitle>
            <CardDescription>
              Files that should be excluded from review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="e.g., package-lock.json"
                value={newIgnoredFile}
                onChange={(e) => setNewIgnoredFile(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIgnoredFile()}
              />
              <Button onClick={addIgnoredFile} leftIcon={<Plus className="w-4 h-4" />}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.ignoredFiles.map((file) => (
                <Badge key={file} className="flex items-center gap-1">
                  {file}
                  <button
                    onClick={() => removeIgnoredFile(file)}
                    className="ml-1 hover:text-coral-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ignored Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ignored Patterns</CardTitle>
            <CardDescription>
              Regex patterns for files to exclude from review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="e.g., \.test\."
                value={newIgnoredPattern}
                onChange={(e) => setNewIgnoredPattern(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIgnoredPattern()}
              />
              <Button onClick={addIgnoredPattern} leftIcon={<Plus className="w-4 h-4" />}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.ignoredPatterns.map((pattern) => (
                <Badge key={pattern} className="flex items-center gap-1 font-mono text-xs">
                  {pattern}
                  <button
                    onClick={() => removeIgnoredPattern(pattern)}
                    className="ml-1 hover:text-coral-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Language Settings</CardTitle>
            <CardDescription>
              Configure settings for specific programming languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(settings.languageSettings).map(([lang, langSettings]) => (
                <div
                  key={lang}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface-tertiary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white capitalize">{lang}</span>
                    {langSettings.enabled && (
                      <Badge variant="success">Enabled</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSettings({
                        ...settings,
                        languageSettings: {
                          ...settings.languageSettings,
                          [lang]: {
                            ...langSettings,
                            enabled: !langSettings.enabled,
                          },
                        },
                      });
                    }}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      langSettings.enabled ? 'bg-ocean-600' : 'bg-ocean-900'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        langSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
