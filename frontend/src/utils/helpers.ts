import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date relative to now
export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Format date
export function formatDate(date: string | Date, pattern = 'PPP'): string {
  return format(new Date(date), pattern);
}

// Format number
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

// Format percentage
export function formatPercentage(num: number, decimals = 1): string {
  return `${num.toFixed(decimals)}%`;
}

// Format duration in milliseconds
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

// Get severity color
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-coral-400';
    case 'warning':
      return 'text-amber-400';
    case 'info':
      return 'text-ocean-400';
    default:
      return 'text-gray-400';
  }
}

// Get severity badge class
export function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'badge-critical';
    case 'warning':
      return 'badge-warning';
    case 'info':
      return 'badge-info';
    default:
      return 'badge';
  }
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-400';
    case 'in_progress':
      return 'text-ocean-400';
    case 'pending':
      return 'text-amber-400';
    case 'failed':
      return 'text-coral-400';
    default:
      return 'text-gray-400';
  }
}

// Get category icon name
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'security':
      return 'Shield';
    case 'performance':
      return 'Zap';
    case 'style':
      return 'Paintbrush';
    case 'bug':
      return 'Bug';
    case 'best_practice':
      return 'CheckCircle';
    default:
      return 'AlertCircle';
  }
}

// Get language color
export function getLanguageColor(language: string | null): string {
  const colors: Record<string, string> = {
    javascript: 'bg-yellow-400',
    typescript: 'bg-blue-400',
    python: 'bg-green-400',
    java: 'bg-red-400',
    go: 'bg-cyan-400',
    rust: 'bg-orange-400',
    ruby: 'bg-red-500',
    php: 'bg-purple-400',
  };
  return colors[language?.toLowerCase() ?? ''] ?? 'bg-gray-400';
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

// Parse repository full name
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  return { owner: owner ?? '', repo: repo ?? '' };
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
