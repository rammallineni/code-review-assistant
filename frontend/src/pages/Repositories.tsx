import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  Search,
  Lock,
  Globe,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  useRepositories,
  useGitHubRepositories,
  useConnectRepository,
} from '../hooks/useRepositories';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { formatRelativeDate, getLanguageColor, cn } from '../utils/helpers';
import { GitHubRepository } from '../types';

export default function Repositories() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: repositories, isLoading } = useRepositories();

  const filteredRepos = repositories?.data?.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Repositories</h1>
          <p className="text-ocean-400 mt-1">
            Manage your connected GitHub repositories
          </p>
        </div>
        <Button
          onClick={() => setShowConnectModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Connect Repository
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search repositories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-5 h-5" />}
      />

      {/* Repository Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredRepos?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="w-12 h-12 text-ocean-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'No matching repositories' : 'No repositories connected'}
            </h3>
            <p className="text-ocean-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Connect a GitHub repository to start reviewing code'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowConnectModal(true)}>
                Connect Your First Repository
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos?.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/app/repositories/${repo.id}`}>
                <Card className="h-full hover:border-ocean-600/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {repo.language && (
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full',
                              getLanguageColor(repo.language)
                            )}
                          />
                        )}
                        <h3 className="font-semibold text-white">{repo.name}</h3>
                      </div>
                      {repo.isPrivate ? (
                        <Lock className="w-4 h-4 text-ocean-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-ocean-500" />
                      )}
                    </div>
                    
                    <p className="text-sm text-ocean-400 mb-4 line-clamp-2">
                      {repo.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {repo.autoReview && (
                          <Badge variant="success">Auto-review</Badge>
                        )}
                        {repo.language && (
                          <Badge>{repo.language}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-ocean-500">
                        {formatRelativeDate(repo.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <ConnectRepositoryModal onClose={() => setShowConnectModal(false)} />
      )}
    </div>
  );
}

function ConnectRepositoryModal({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const { data: githubRepos, isLoading } = useGitHubRepositories(page);
  const connectMutation = useConnectRepository();

  const handleConnect = async (repo: GitHubRepository) => {
    const [owner, name] = repo.fullName.split('/');
    await connectMutation.mutateAsync({ owner: owner!, repo: name! });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Connect Repository</CardTitle>
              <button
                onClick={onClose}
                className="text-ocean-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-ocean-400 animate-spin mx-auto" />
                <p className="text-ocean-400 mt-2">Loading repositories...</p>
              </div>
            ) : (
              <div className="divide-y divide-ocean-900/30">
                {githubRepos?.data?.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-4 hover:bg-surface-tertiary/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={repo.owner.avatarUrl}
                        alt={repo.owner.login}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white truncate">
                            {repo.fullName}
                          </span>
                          {repo.private ? (
                            <Lock className="w-3 h-3 text-ocean-500 flex-shrink-0" />
                          ) : (
                            <Globe className="w-3 h-3 text-ocean-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-ocean-400 truncate">
                          {repo.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ocean-400 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(repo)}
                        isLoading={connectMutation.isPending}
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="flex-shrink-0 p-4 border-t border-ocean-900/50">
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-ocean-400">Page {page}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!githubRepos?.data?.length}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
