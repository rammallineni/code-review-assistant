import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Target,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useDashboard } from '../hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatCardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { formatNumber, formatPercentage, cn } from '../utils/helpers';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const COLORS = {
  categories: ['#ff6b4a', '#fbbf24', '#0091c3', '#10b981', '#8b5cf6', '#6b7280'],
  severity: ['#ff6b4a', '#fbbf24', '#0091c3'],
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState(30);
  const { data: dashboardData, isLoading } = useDashboard();

  const dashboard = dashboardData?.data;

  const timeRanges = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-ocean-400 mt-1">Track your code review metrics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ocean-400">Total Reviews</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatNumber(dashboard?.overview.totalReviews ?? 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-600/20 to-ocean-600/5 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-ocean-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ocean-400">Total Issues</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatNumber(dashboard?.overview.totalIssues ?? 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-600/20 to-coral-600/5 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-coral-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ocean-400">Avg Issues/Review</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {(dashboard?.overview.averageIssuesPerReview ?? 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-600/5 flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ocean-400">Resolution Rate</p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {formatPercentage(dashboard?.resolutionRate.rate ?? 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 flex items-center justify-center">
                      <Target className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-ocean-400" />
                  Review Activity Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboard?.timeline ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3252" />
                    <XAxis
                      dataKey="date"
                      stroke="#4a6fa5"
                      tick={{ fill: '#4a6fa5', fontSize: 12 }}
                      tickFormatter={(v) =>
                        new Date(v).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <YAxis stroke="#4a6fa5" tick={{ fill: '#4a6fa5', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111f36',
                        border: '1px solid #1e3252',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="reviews"
                      name="Reviews"
                      stroke="#0091c3"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="issues"
                      name="Issues"
                      stroke="#ff6b4a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Issues by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={dashboard?.categories ?? []}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {dashboard?.categories?.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS.categories[index % COLORS.categories.length]}
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
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {dashboard?.categories?.map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS.categories[index % COLORS.categories.length],
                            }}
                          />
                          <span className="text-sm text-ocean-300 capitalize">
                            {cat.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {cat.count}
                          </span>
                          <span className="text-xs text-ocean-500">
                            ({formatPercentage(cat.percentage)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Issues by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboard?.severity ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3252" />
                    <XAxis
                      dataKey="severity"
                      stroke="#4a6fa5"
                      tick={{ fill: '#4a6fa5', fontSize: 12 }}
                    />
                    <YAxis stroke="#4a6fa5" tick={{ fill: '#4a6fa5', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111f36',
                        border: '1px solid #1e3252',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" name="Issues">
                      {dashboard?.severity?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS.severity[index % COLORS.severity.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Top Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Most Common Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.topIssues?.map((issue, index) => (
                    <div key={issue.title} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-ocean-500 w-6">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{issue.title}</p>
                        <div className="mt-1 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-ocean-500 to-ocean-400 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (issue.count /
                                  Math.max(...dashboard.topIssues.map((i) => i.count))) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-ocean-300">
                        {issue.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Repository Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Repository Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ocean-900/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-ocean-400 uppercase tracking-wider">
                        Repository
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-ocean-400 uppercase tracking-wider">
                        Reviews
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-ocean-400 uppercase tracking-wider">
                        Issues
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-ocean-400 uppercase tracking-wider">
                        Avg Issues
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ocean-900/30">
                    {dashboard?.repositories?.map((repo) => (
                      <tr key={repo.repositoryId} className="hover:bg-surface-tertiary/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-white font-medium">
                            {repo.repositoryName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-ocean-300">
                          {repo.totalReviews}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-ocean-300">
                          {repo.totalIssues}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-ocean-300">
                          {repo.totalReviews > 0
                            ? (repo.totalIssues / repo.totalReviews).toFixed(1)
                            : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
