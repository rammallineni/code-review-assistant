import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  FileCode,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useReview, useResolveIssue, useUnresolveIssue } from '../hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatRelativeDate, formatDuration, cn, getCategoryIcon } from '../utils/helpers';
import { Issue, IssueSeverity, IssueCategory } from '../types';
import * as Icons from 'lucide-react';

const severityConfig: Record<
  IssueSeverity,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  critical: {
    icon: AlertTriangle,
    color: 'text-coral-400',
    bgColor: 'bg-coral-900/20 border-coral-700/50',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/20 border-amber-700/50',
  },
  info: {
    icon: Info,
    color: 'text-ocean-400',
    bgColor: 'bg-ocean-900/20 border-ocean-700/50',
  },
};

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | null>(null);
  
  const { data: reviewData, isLoading } = useReview(id!);
  const resolveMutation = useResolveIssue();
  const unresolveMutation = useUnresolveIssue();

  const review = reviewData?.data?.review;
  const allIssues = reviewData?.data?.issues ?? [];
  
  // Filter issues
  const issues = allIssues.filter((issue) => {
    if (severityFilter && issue.severity !== severityFilter) return false;
    if (categoryFilter && issue.category !== categoryFilter) return false;
    return true;
  });

  const handleToggleResolved = (issue: Issue) => {
    if (issue.isResolved) {
      unresolveMutation.mutate(issue.id);
    } else {
      resolveMutation.mutate(issue.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-ocean-400 animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-ocean-400">Review not found</p>
          <Link to="/app/reviews">
            <Button variant="ghost" className="mt-4">
              Go back
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/app/reviews"
        className="inline-flex items-center gap-2 text-ocean-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reviews
      </Link>

      {/* Review Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-white">
                  {review.prTitle || `PR #${review.prNumber}`}
                </h1>
                <Badge
                  variant={
                    review.status === 'completed'
                      ? 'success'
                      : review.status === 'failed'
                      ? 'critical'
                      : 'info'
                  }
                >
                  {review.status}
                </Badge>
              </div>
              <p className="text-ocean-400">
                by {review.prAuthor} • {formatRelativeDate(review.createdAt)}
              </p>
            </div>
            {review.prUrl && (
              <a href={review.prUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View PR
                </Button>
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-ocean-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-coral-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-coral-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{review.criticalCount}</p>
                <p className="text-xs text-ocean-400">Critical</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{review.warningCount}</p>
                <p className="text-xs text-ocean-400">Warnings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ocean-900/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-ocean-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{review.infoCount}</p>
                <p className="text-xs text-ocean-400">Info</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                <Clock className="w-5 h-5 text-ocean-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {review.processingTimeMs ? formatDuration(review.processingTimeMs) : '-'}
                </p>
                <p className="text-xs text-ocean-400">Time</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          {review.summary && (
            <div className="mt-6 pt-6 border-t border-ocean-900/50">
              <h3 className="text-sm font-medium text-ocean-300 mb-2">Summary</h3>
              <p className="text-ocean-400">{review.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-ocean-400">Filter by:</span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={severityFilter === null ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSeverityFilter(null)}
              >
                All Severity
              </Button>
              {(['critical', 'warning', 'info'] as const).map((sev) => {
                const config = severityConfig[sev];
                return (
                  <Button
                    key={sev}
                    variant={severityFilter === sev ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSeverityFilter(sev)}
                    leftIcon={<config.icon className={cn('w-4 h-4', config.color)} />}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {allIssues.length === 0 ? 'No issues found!' : 'No matching issues'}
            </h3>
            <p className="text-ocean-400">
              {allIssues.length === 0
                ? 'This pull request looks good!'
                : 'Try adjusting your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue, index) => {
            const config = severityConfig[issue.severity];
            const SeverityIcon = config.icon;
            const CategoryIconName = getCategoryIcon(issue.category) as keyof typeof Icons;
            const CategoryIcon = Icons[CategoryIconName] || Icons.AlertCircle;

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'border-l-4 transition-opacity',
                    issue.severity === 'critical' && 'border-l-coral-500',
                    issue.severity === 'warning' && 'border-l-amber-500',
                    issue.severity === 'info' && 'border-l-ocean-500',
                    issue.isResolved && 'opacity-60'
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          config.bgColor,
                          'border'
                        )}
                      >
                        <SeverityIcon className={cn('w-5 h-5', config.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className={cn(
                              'font-semibold text-white',
                              issue.isResolved && 'line-through'
                            )}>
                              {issue.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={
                                issue.severity === 'critical' ? 'critical' :
                                issue.severity === 'warning' ? 'warning' : 'info'
                              }>
                                {issue.severity}
                              </Badge>
                              <Badge>
                                <CategoryIcon className="w-3 h-3 mr-1" />
                                {issue.category.replace('_', ' ')}
                              </Badge>
                              {issue.isResolved && (
                                <Badge variant="success">Resolved</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleResolved(issue)}
                            isLoading={
                              resolveMutation.isPending || unresolveMutation.isPending
                            }
                            leftIcon={
                              issue.isResolved ? (
                                <RotateCcw className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )
                            }
                          >
                            {issue.isResolved ? 'Unresolve' : 'Resolve'}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-sm text-ocean-400">
                          <FileCode className="w-4 h-4" />
                          <span>{issue.filePath}</span>
                          {issue.lineStart && (
                            <span>
                              : {issue.lineStart}
                              {issue.lineEnd && issue.lineEnd !== issue.lineStart && (
                                `-${issue.lineEnd}`
                              )}
                            </span>
                          )}
                        </div>

                        <p className="mt-4 text-ocean-300">{issue.description}</p>

                        {issue.suggestion && (
                          <div className="mt-4 p-4 rounded-lg bg-emerald-900/10 border border-emerald-700/30">
                            <h4 className="text-sm font-medium text-emerald-400 mb-2">
                              Suggestion
                            </h4>
                            <p className="text-sm text-ocean-300">{issue.suggestion}</p>
                          </div>
                        )}

                        {issue.codeSnippet && (
                          <div className="mt-4 rounded-lg overflow-hidden">
                            <SyntaxHighlighter
                              language={issue.language || 'typescript'}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                              }}
                            >
                              {issue.codeSnippet}
                            </SyntaxHighlighter>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
