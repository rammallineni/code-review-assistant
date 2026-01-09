import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../services/api';
import { Review, Issue, PaginatedResponse, ApiResponse } from '../types';
import toast from 'react-hot-toast';

export function useReviews(
  filters?: { repositoryId?: string; status?: string },
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['reviews', filters, page, limit],
    queryFn: async () => {
      const response = await reviewsApi.list(filters, page, limit);
      return response.data as PaginatedResponse<Review>;
    },
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const response = await reviewsApi.get(id);
      return response.data as ApiResponse<{ review: Review; issues: Issue[] }>;
    },
    enabled: !!id,
  });
}

export function useReviewIssues(
  id: string,
  filters?: { severity?: string; category?: string }
) {
  return useQuery({
    queryKey: ['review-issues', id, filters],
    queryFn: async () => {
      const response = await reviewsApi.getIssues(id, filters);
      return response.data as ApiResponse<Issue[]>;
    },
    enabled: !!id,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      prNumber,
    }: {
      owner: string;
      repo: string;
      prNumber: number;
    }) => {
      const response = await reviewsApi.create(owner, repo, prNumber);
      return response.data as ApiResponse<Review>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review started successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start review');
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await reviewsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete review');
    },
  });
}

export function useResolveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: string) => {
      const response = await reviewsApi.resolveIssue(issueId);
      return response.data as ApiResponse<Issue>;
    },
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['review', data.data.reviewId] });
        queryClient.invalidateQueries({ queryKey: ['review-issues', data.data.reviewId] });
      }
      toast.success('Issue marked as resolved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resolve issue');
    },
  });
}

export function useUnresolveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueId: string) => {
      const response = await reviewsApi.unresolveIssue(issueId);
      return response.data as ApiResponse<Issue>;
    },
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['review', data.data.reviewId] });
        queryClient.invalidateQueries({ queryKey: ['review-issues', data.data.reviewId] });
      }
      toast.success('Issue marked as unresolved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unresolve issue');
    },
  });
}
