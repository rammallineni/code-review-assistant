import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoriesApi } from '../services/api';
import { Repository, GitHubRepository, PullRequest, PaginatedResponse, ApiResponse } from '../types';
import toast from 'react-hot-toast';

export function useRepositories(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['repositories', page, limit],
    queryFn: async () => {
      const response = await repositoriesApi.list(page, limit);
      return response.data as PaginatedResponse<Repository>;
    },
  });
}

export function useGitHubRepositories(page = 1) {
  return useQuery({
    queryKey: ['github-repositories', page],
    queryFn: async () => {
      const response = await repositoriesApi.listFromGitHub(page);
      return response.data as ApiResponse<GitHubRepository[]>;
    },
  });
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: ['repository', id],
    queryFn: async () => {
      const response = await repositoriesApi.get(id);
      return response.data as ApiResponse<Repository>;
    },
    enabled: !!id,
  });
}

export function usePullRequests(repositoryId: string, state = 'open', page = 1) {
  return useQuery({
    queryKey: ['pull-requests', repositoryId, state, page],
    queryFn: async () => {
      const response = await repositoriesApi.listPullRequests(repositoryId, state, page);
      return response.data as ApiResponse<PullRequest[]>;
    },
    enabled: !!repositoryId,
  });
}

export function useConnectRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ owner, repo }: { owner: string; repo: string }) => {
      const response = await repositoriesApi.connect(owner, repo);
      return response.data as ApiResponse<Repository>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      toast.success('Repository connected successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect repository');
    },
  });
}

export function useUpdateRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { autoReview?: boolean };
    }) => {
      const response = await repositoriesApi.update(id, data);
      return response.data as ApiResponse<Repository>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repository', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      toast.success('Repository updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update repository');
    },
  });
}

export function useDisconnectRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await repositoriesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      toast.success('Repository disconnected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect repository');
    },
  });
}
