import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import { DashboardData, ApiResponse } from '../types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await analyticsApi.getDashboard();
      return response.data as ApiResponse<DashboardData>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await analyticsApi.getOverview();
      return response.data;
    },
  });
}

export function useCategoryBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: async () => {
      const response = await analyticsApi.getCategories();
      return response.data;
    },
  });
}

export function useSeverityBreakdown() {
  return useQuery({
    queryKey: ['analytics', 'severity'],
    queryFn: async () => {
      const response = await analyticsApi.getSeverity();
      return response.data;
    },
  });
}

export function useTimeline(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'timeline', days],
    queryFn: async () => {
      const response = await analyticsApi.getTimeline(days);
      return response.data;
    },
  });
}

export function useRepositoryStats() {
  return useQuery({
    queryKey: ['analytics', 'repositories'],
    queryFn: async () => {
      const response = await analyticsApi.getRepositories();
      return response.data;
    },
  });
}

export function useTopIssues(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'top-issues', limit],
    queryFn: async () => {
      const response = await analyticsApi.getTopIssues(limit);
      return response.data;
    },
  });
}

export function useResolutionRate() {
  return useQuery({
    queryKey: ['analytics', 'resolution-rate'],
    queryFn: async () => {
      const response = await analyticsApi.getResolutionRate();
      return response.data;
    },
  });
}
