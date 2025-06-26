'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService, StaffMember, StaffCreateRequest, StaffFilters } from '../api/services/staff';
import { toast } from 'react-hot-toast';

// Get staff members with filters
export const useStaff = (filters?: StaffFilters) => {
  return useQuery({
    queryKey: ['staff', filters],
    queryFn: () => staffService.getStaff(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Get single staff member
export const useStaffMember = (id: string) => {
  return useQuery({
    queryKey: ['staffMember', id],
    queryFn: () => staffService.getStaffMember(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
};

// Get staff analytics
export const useStaffAnalytics = () => {
  return useQuery({
    queryKey: ['staffAnalytics'],
    queryFn: () => staffService.getStaffAnalytics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
};

// Get staff performance
export const useStaffPerformance = (id: string, period: 'week' | 'month' | 'quarter' | 'year') => {
  return useQuery({
    queryKey: ['staffPerformance', id, period],
    queryFn: () => staffService.getStaffPerformance(id, period),
    enabled: !!id,
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });
};

// Create staff member mutation
export const useCreateStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StaffCreateRequest) => staffService.createStaffMember(data),
    onSuccess: (newStaff) => {
      // Invalidate and refetch staff list
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffAnalytics'] });
      
      toast.success('Staff member created successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to create staff member:', error);
      toast.error('Failed to create staff member. Please try again.');
    },
  });
};

// Update staff member mutation
export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffCreateRequest> }) =>
      staffService.updateStaffMember(id, data),
    onSuccess: (updatedStaff) => {
      // Update the specific staff member in cache
      queryClient.setQueryData(['staffMember', updatedStaff.id], updatedStaff);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffAnalytics'] });
      
      toast.success('Staff member updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update staff member:', error);
      toast.error('Failed to update staff member. Please try again.');
    },
  });
};

// Delete staff member mutation
export const useDeleteStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffService.deleteStaffMember(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['staffMember', deletedId] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffAnalytics'] });
      
      toast.success('Staff member deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to delete staff member:', error);
      toast.error('Failed to delete staff member. Please try again.');
    },
  });
};

// Update staff status mutation
export const useUpdateStaffStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'on_leave' }) =>
      staffService.updateStaffStatus(id, status),
    onSuccess: (updatedStaff) => {
      // Update the specific staff member in cache
      queryClient.setQueryData(['staffMember', updatedStaff.id], updatedStaff);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffAnalytics'] });
      
      toast.success('Staff status updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update staff status:', error);
      toast.error('Failed to update staff status. Please try again.');
    },
  });
};

// Update staff permissions mutation
export const useUpdateStaffPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      staffService.updateStaffPermissions(id, permissions),
    onSuccess: (updatedStaff) => {
      // Update the specific staff member in cache
      queryClient.setQueryData(['staffMember', updatedStaff.id], updatedStaff);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      
      toast.success('Staff permissions updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update staff permissions:', error);
      toast.error('Failed to update staff permissions. Please try again.');
    },
  });
};

// Combined staff management actions
export const useStaffActions = () => {
  const createMutation = useCreateStaffMember();
  const updateMutation = useUpdateStaffMember();
  const deleteMutation = useDeleteStaffMember();
  const updateStatusMutation = useUpdateStaffStatus();
  const updatePermissionsMutation = useUpdateStaffPermissions();

  return {
    createStaff: createMutation.mutate,
    updateStaff: updateMutation.mutate,
    deleteStaff: deleteMutation.mutate,
    updateStaffStatus: updateStatusMutation.mutate,
    updateStaffPermissions: updatePermissionsMutation.mutate,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingPermissions: updatePermissionsMutation.isPending,
    
    isLoading: createMutation.isPending || updateMutation.isPending || 
               deleteMutation.isPending || updateStatusMutation.isPending || 
               updatePermissionsMutation.isPending,
  };
};