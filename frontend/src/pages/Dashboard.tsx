import { motion } from 'framer-motion';
import {
  FileSearch,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  TrendingUp,
  GitPullRequest,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useAnalytics';
import { useReviews } from '../hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { StatCardSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import {
  formatNumber,
  formatDuration,
  formatRelativeDate,
  getStatusColor,
  cn,
} from '../utils/helpers';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const statCards = [
  {
    key: 'totalReviews',
    label: 'Total Reviews',
    icon: FileSearch,
    color: 'text-ocean-400',
    bgColor: 'from-ocean-600/20 to-ocean-600/5',
  },
  {
    key: 'criticalIssues',
    label: 'Critical Issues',
    icon: AlertTriangle,
    color: 'text-coral-400',
    bgColor: 'from-coral-600/20 to-coral-600/5',
  },
  {
    key: 'warningIssues',
    label: 'Warnings',
    icon: AlertCircle,
    color: 'text-amber-400',
    bgColor: 'from-amber-600/20 to-amber-600/5',
  },
  {
    key: 'averageProcessingTime',
    label: 'Avg. Processing',
    icon: Clock,
    color: 'text-emerald-400',
    bgColor: 'from-emerald-600/20 to-emerald-600/5',
    format: (v: number) => formatDuration(v),
  },
];

const COLORS = ['#ff6b4a', '#fbbf24', '#0091c3', '#10b981', '#8b5cf6', '#6b7280'];

export default function Dashboard() {
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  const { data: recentReviews, isLoading: reviewsLoading } = useReviews({}, 1, 5);

  const dashboard = dashboardData?.data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-ocean-400 mt-1">Overview of your code review activity</p>
        </div>
        <Link to="/app/reviews">
          <Button leftIcon={<GitPullRequest className="w-4 h-4" />}>
            New Review
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardLoading
          ? statCards.map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat, index) => {
              const value = dashboard?.overview[stat.key as keyof typeof dashboard.overview];
              const displayValue = stat.format
                ? stat.format(value as number)
                : formatNumber(value as number);

              return (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                            stat.bgColor
                          )}
                        >
                          <stat.icon className={cn('w-6 h-6', stat.color)} />
                        </div>
                        <div>
                          <p className="text-sm text-ocean-400">{stat.label}</p>
                          <p className="text-2xl font-bold text-white">{displayValue}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-ocean-400" />
                Review Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="h-64 skeleton" />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={dashboard?.timeline ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3252" />
                    <XAxis
                      dataKey="date"
                      stroke="#4a6fa5"
                      tick={{ fill: '#4a6fa5', fontSize: 12 }}
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#4a6fa5" tick={{ fill: '#4a6fa5', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111f36',
                        border: '1px solid #1e3252',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="reviews"
                      stroke="#0091c3"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="issues"
                      stroke="#ff6b4a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Issue Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardLoading ? (
                <div className="h-64 skeleton" />
              ) : (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={dashboard?.categories ?? []}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {dashboard?.categories?.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111f36',
                          border: '1px solid #1e3252',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {dashboard?.categories?.map((cat, index) => (
                      <div key={cat.category} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-ocean-300 capitalize">
                          {cat.category.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-ocean-500 ml-auto">
                          {cat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Reviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Reviews</CardTitle>
            <Link to="/app/reviews">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {reviewsLoading ? (
              <div className="divide-y divide-ocean-900/30">
                {[...Array(3)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : recentReviews?.data?.length === 0 ? (
              <div className="p-8 text-center">
                <FileSearch className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
                <p className="text-ocean-400">No reviews yet</p>
                <p className="text-sm text-ocean-500 mt-1">
                  Start by reviewing a pull request
                </p>
              </div>
            ) : (
              <div className="divide-y divide-ocean-900/30">
                {recentReviews?.data?.map((review) => (
                  <Link
                    key={review.id}
                    to={`/app/reviews/${review.id}`}
                    className="block px-6 py-4 hover:bg-surface-tertiary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">
                            {review.prTitle || `PR #${review.prNumber}`}
                          </span>
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
                        <p className="text-sm text-ocean-400 mt-1">
                          by {review.prAuthor} • {formatRelativeDate(review.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {review.criticalCount > 0 && (
                          <span className="text-coral-400">
                            {review.criticalCount} critical
                          </span>
                        )}
                        {review.warningCount > 0 && (
                          <span className="text-amber-400">
                            {review.warningCount} warnings
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
