'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { imageService, JewelryImage, ImageFilters, ImageUploadRequest } from '../api/services/images';
import { toast } from 'react-hot-toast';

// Get images with filters
export const useImages = (filters?: ImageFilters) => {
  return useQuery({
    queryKey: ['images', filters],
    queryFn: () => imageService.getImages(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Get single image
export const useImage = (id: string) => {
  return useQuery({
    queryKey: ['image', id],
    queryFn: () => imageService.getImage(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
};

// Get gallery by category
export const useGalleryByCategory = (category: string) => {
  return useQuery({
    queryKey: ['gallery', category],
    queryFn: () => imageService.getGalleryByCategory(category),
    enabled: !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

// Get image analytics
export const useImageAnalytics = () => {
  return useQuery({
    queryKey: ['imageAnalytics'],
    queryFn: () => imageService.getImageAnalytics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
};

// Search images
export const useImageSearch = (query: string) => {
  return useQuery({
    queryKey: ['imageSearch', query],
    queryFn: () => imageService.searchImages(query),
    enabled: !!query && query.length > 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Upload image mutation
export const useUploadImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImageUploadRequest) => imageService.uploadImage(data),
    onSuccess: (newImage) => {
      // Invalidate and refetch images
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['imageAnalytics'] });
      
      toast.success('Image uploaded successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image. Please try again.');
    },
  });
};

// Bulk upload images mutation
export const useBulkUploadImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, jewelry_item_id }: { files: File[]; jewelry_item_id: string }) =>
      imageService.bulkUploadImages(files, jewelry_item_id),
    onSuccess: (newImages) => {
      // Invalidate and refetch images
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['imageAnalytics'] });
      
      toast.success(`${newImages.length} images uploaded successfully!`);
    },
    onError: (error: any) => {
      console.error('Failed to bulk upload images:', error);
      toast.error('Failed to upload images. Please try again.');
    },
  });
};

// Update image mutation
export const useUpdateImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<JewelryImage, 'alt_text' | 'is_primary' | 'tags' | 'sort_order'>> }) =>
      imageService.updateImage(id, updates),
    onSuccess: (updatedImage) => {
      // Update the specific image in cache
      queryClient.setQueryData(['image', updatedImage.id], updatedImage);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      
      toast.success('Image updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update image:', error);
      toast.error('Failed to update image. Please try again.');
    },
  });
};

// Delete image mutation
export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => imageService.deleteImage(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['image', deletedId] });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['imageAnalytics'] });
      
      toast.success('Image deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image. Please try again.');
    },
  });
};

// Optimize image mutation
export const useOptimizeImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => imageService.optimizeImage(id),
    onSuccess: (optimizedImage) => {
      // Update the specific image in cache
      queryClient.setQueryData(['image', optimizedImage.id], optimizedImage);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['images'] });
      
      toast.success('Image optimized successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to optimize image:', error);
      toast.error('Failed to optimize image. Please try again.');
    },
  });
};

// Combined image management actions
export const useImageActions = () => {
  const uploadMutation = useUploadImage();
  const bulkUploadMutation = useBulkUploadImages();
  const updateMutation = useUpdateImage();
  const deleteMutation = useDeleteImage();
  const optimizeMutation = useOptimizeImage();

  return {
    uploadImage: uploadMutation.mutate,
    bulkUploadImages: bulkUploadMutation.mutate,
    updateImage: updateMutation.mutate,
    deleteImage: deleteMutation.mutate,
    optimizeImage: optimizeMutation.mutate,
    
    isUploading: uploadMutation.isPending,
    isBulkUploading: bulkUploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isOptimizing: optimizeMutation.isPending,
    
    isLoading: uploadMutation.isPending || bulkUploadMutation.isPending || 
               updateMutation.isPending || deleteMutation.isPending || 
               optimizeMutation.isPending,
  };
};