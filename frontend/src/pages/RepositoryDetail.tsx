import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitBranch,
  GitPullRequest,
  Settings,
  ExternalLink,
  Play,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useRepository, usePullRequests, useUpdateRepository } from '../hooks/useRepositories';
import { useCreateReview } from '../hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { formatRelativeDate, parseRepoFullName, cn } from '../utils/helpers';
import { PullRequest } from '../types';

export default function RepositoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [prState, setPrState] = useState<'open' | 'closed' | 'all'>('open');
  
  const { data: repository, isLoading: repoLoading } = useRepository(id!);
  const { data: pullRequests, isLoading: prsLoading } = usePullRequests(id!, prState);
  const updateMutation = useUpdateRepository();
  const createReviewMutation = useCreateReview();

  const repo = repository?.data;

  const handleReview = async (pr: PullRequest) => {
    if (!repo) return;
    const { owner, repo: repoName } = parseRepoFullName(repo.fullName);
    await createReviewMutation.mutateAsync({
      owner,
      repo: repoName,
      prNumber: pr.number,
    });
  };

  const toggleAutoReview = () => {
    if (!repo) return;
    updateMutation.mutate({
      id: repo.id,
      data: { autoReview: !repo.autoReview },
    });
  };

  if (repoLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-ocean-400 animate-spin" />
      </div>
    );
  }

  if (!repo) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-ocean-400">Repository not found</p>
          <Link to="/app/repositories">
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
        to="/app/repositories"
        className="inline-flex items-center gap-2 text-ocean-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to repositories
      </Link>

      {/* Repository Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-600/20 to-ocean-600/5 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-ocean-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{repo.fullName}</h1>
                <p className="text-ocean-400">
                  {repo.description || 'No description'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View on GitHub
                </Button>
              </a>
              <Link to={`/app/settings?repo=${repo.id}`}>
                <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-ocean-900/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ocean-400">Auto-review:</span>
              <button
                onClick={toggleAutoReview}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  repo.autoReview ? 'bg-ocean-600' : 'bg-ocean-900'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    repo.autoReview ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            {repo.language && (
              <Badge>{repo.language}</Badge>
            )}
            <span className="text-sm text-ocean-500">
              Default branch: {repo.defaultBranch}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pull Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-ocean-400" />
            Pull Requests
          </CardTitle>
          <div className="flex items-center gap-2">
            {(['open', 'closed', 'all'] as const).map((state) => (
              <Button
                key={state}
                variant={prState === state ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPrState(state)}
              >
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {prsLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-ocean-400 animate-spin mx-auto" />
            </div>
          ) : pullRequests?.data?.length === 0 ? (
            <div className="p-8 text-center">
              <GitPullRequest className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
              <p className="text-ocean-400">No {prState} pull requests</p>
            </div>
          ) : (
            <div className="divide-y divide-ocean-900/30">
              {pullRequests?.data?.map((pr, index) => (
                <motion.div
                  key={pr.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-surface-tertiary/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <a
                          href={pr.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-white hover:text-ocean-300 truncate"
                        >
                          {pr.title}
                        </a>
                        <Badge
                          variant={pr.state === 'open' ? 'success' : 'default'}
                        >
                          {pr.state}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-ocean-400">
                        <span>#{pr.number}</span>
                        <span>by {pr.user.login}</span>
                        <span>{formatRelativeDate(pr.createdAt)}</span>
                        <span className="text-emerald-400">+{pr.additions}</span>
                        <span className="text-coral-400">-{pr.deletions}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleReview(pr)}
                      isLoading={createReviewMutation.isPending}
                      leftIcon={<Play className="w-4 h-4" />}
                    >
                      Review
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
