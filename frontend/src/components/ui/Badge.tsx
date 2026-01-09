import { cn } from '../../utils/helpers';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'critical' | 'warning' | 'info' | 'success';
}

export default function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'badge bg-ocean-900/50 text-ocean-300 border border-ocean-700/50',
    critical: 'badge-critical',
    warning: 'badge-warning',
    info: 'badge-info',
    success: 'badge-success',
  };

  return <span className={cn(variants[variant], className)} {...props} />;
}
