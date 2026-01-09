import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSearch,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { formatRelativeDate, formatDuration, cn } from '../utils/helpers';
import { ReviewStatus } from '../types';

const statusConfig: Record<
  ReviewStatus,
  { icon: React.ElementType; color: string; label: string }
> = {
  completed: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completed' },
  in_progress: { icon: Loader2, color: 'text-ocean-400', label: 'In Progress' },
  pending: { icon: Clock, color: 'text-amber-400', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-coral-400', label: 'Failed' },
};

export default function Reviews() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  
  const { data: reviews, isLoading } = useReviews(
    statusFilter ? { status: statusFilter } : undefined,
    page,
    20
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-ocean-400 mt-1">View and manage your code reviews</p>
        </div>
        <Link to="/app/repositories">
          <Button>New Review</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <Filter className="w-5 h-5 text-ocean-400 flex-shrink-0" />
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === undefined ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  leftIcon={<config.icon className={cn('w-4 h-4', config.color)} />}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : reviews?.data?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSearch className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No reviews found</h3>
            <p className="text-ocean-400 mb-6">
              {statusFilter
                ? `No reviews with status "${statusFilter}"`
                : 'Start by reviewing a pull request'}
            </p>
            <Link to="/app/repositories">
              <Button>Browse Repositories</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews?.data?.map((review, index) => {
            const statusInfo = statusConfig[review.status];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/app/reviews/${review.id}`}>
                  <Card className="hover:border-ocean-600/50 transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusIcon
                              className={cn(
                                'w-5 h-5 flex-shrink-0',
                                statusInfo.color,
                                review.status === 'in_progress' && 'animate-spin'
                              )}
                            />
                            <h3 className="font-semibold text-white truncate">
                              {review.prTitle || `PR #${review.prNumber}`}
                            </h3>
                            <Badge
                              variant={
                                review.status === 'completed'
                                  ? 'success'
                                  : review.status === 'failed'
                                  ? 'critical'
                                  : review.status === 'in_progress'
                                  ? 'info'
                                  : 'warning'
                              }
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-ocean-400 mb-4">
                            by {review.prAuthor} • {formatRelativeDate(review.createdAt)}
                            {review.processingTimeMs && (
                              <span className="ml-2">
                                • Processed in {formatDuration(review.processingTimeMs)}
                              </span>
                            )}
                          </p>

                          {review.status === 'completed' && (
                            <div className="flex items-center gap-4">
                              {review.criticalCount > 0 && (
                                <div className="flex items-center gap-1.5 text-coral-400">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {review.criticalCount} critical
                                  </span>
                                </div>
                              )}
                              {review.warningCount > 0 && (
                                <div className="flex items-center gap-1.5 text-amber-400">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {review.warningCount} warnings
                                  </span>
                                </div>
                              )}
                              {review.infoCount > 0 && (
                                <div className="flex items-center gap-1.5 text-ocean-400">
                                  <Info className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {review.infoCount} info
                                  </span>
                                </div>
                              )}
                              {review.totalIssues === 0 && (
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">No issues found</span>
                                </div>
                              )}
                            </div>
                          )}

                          {review.status === 'failed' && review.errorMessage && (
                            <p className="text-sm text-coral-400">{review.errorMessage}</p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-ocean-500">
                            {review.filesReviewed} files reviewed
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {reviews && reviews.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-ocean-400">
            Page {page} of {reviews.pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= reviews.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
