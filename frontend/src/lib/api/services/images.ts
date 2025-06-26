import { apiClient } from '../client';

export interface JewelryImage {
  id: string;
  jewelry_item_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  metadata: {
    size: number;
    width: number;
    height: number;
    format: string;
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ImageUploadRequest {
  jewelry_item_id: string;
  file: File;
  alt_text: string;
  is_primary: boolean;
  tags: string[];
}

export interface ImageGalleryResponse {
  images: JewelryImage[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ImageFilters {
  category?: string;
  jewelry_item_id?: string;
  tags?: string[];
  is_primary?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

class ImageService {
  private baseUrl = '/api/images';

  // Get all images with filters
  async getImages(filters?: ImageFilters): Promise<ImageGalleryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.jewelry_item_id) params.append('jewelry_item_id', filters.jewelry_item_id);
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters?.is_primary !== undefined) params.append('is_primary', filters.is_primary.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch images:', error);
      // Return mock data for development
      return this.getMockImages(filters);
    }
  }

  // Get single image by ID
  async getImage(id: string): Promise<JewelryImage> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch image:', error);
      throw error;
    }
  }

  // Upload new image
  async uploadImage(data: ImageUploadRequest): Promise<JewelryImage> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('jewelry_item_id', data.jewelry_item_id);
      formData.append('alt_text', data.alt_text);
      formData.append('is_primary', data.is_primary.toString());
      formData.append('tags', JSON.stringify(data.tags));

      const response = await apiClient.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  // Bulk upload images
  async bulkUploadImages(files: File[], jewelry_item_id: string): Promise<JewelryImage[]> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append('jewelry_item_id', jewelry_item_id);

      const response = await apiClient.post(`${this.baseUrl}/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk upload images:', error);
      throw error;
    }
  }

  // Update image metadata
  async updateImage(id: string, updates: Partial<Pick<JewelryImage, 'alt_text' | 'is_primary' | 'tags' | 'sort_order'>>): Promise<JewelryImage> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update image:', error);
      throw error;
    }
  }

  // Delete image
  async deleteImage(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }

  // Optimize image
  async optimizeImage(id: string): Promise<JewelryImage> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${id}/optimize`);
      return response.data;
    } catch (error) {
      console.error('Failed to optimize image:', error);
      throw error;
    }
  }

  // Get gallery by category
  async getGalleryByCategory(category: string): Promise<JewelryImage[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/gallery/${category}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
      // Return mock data for development
      return this.getMockCategoryImages(category);
    }
  }

  // Search images
  async searchImages(query: string): Promise<JewelryImage[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search images:', error);
      return [];
    }
  }

  // Get image analytics
  async getImageAnalytics(): Promise<{
    total_images: number;
    by_category: { category: string; count: number }[];
    storage_used: number;
    recent_uploads: JewelryImage[];
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch image analytics:', error);
      return {
        total_images: 156,
        by_category: [
          { category: 'rings', count: 45 },
          { category: 'necklaces', count: 38 },
          { category: 'earrings', count: 32 },
          { category: 'bracelets', count: 24 },
          { category: 'bangles', count: 17 }
        ],
        storage_used: 2.4, // GB
        recent_uploads: []
      };
    }
  }

  // Mock data for development
  private getMockImages(filters?: ImageFilters): ImageGalleryResponse {
    const mockImages: JewelryImage[] = [
      {
        id: '1',
        jewelry_item_id: '1',
        url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400',
        alt_text: 'Elegant Gold Ring with Diamond',
        is_primary: true,
        sort_order: 1,
        metadata: {
          size: 245760,
          width: 800,
          height: 600,
          format: 'JPEG'
        },
        tags: ['gold', 'diamond', 'ring', 'elegant'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        jewelry_item_id: '2',
        url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
        alt_text: 'Traditional Gold Necklace',
        is_primary: true,
        sort_order: 1,
        metadata: {
          size: 312580,
          width: 800,
          height: 600,
          format: 'JPEG'
        },
        tags: ['gold', 'necklace', 'traditional'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        jewelry_item_id: '3',
        url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400',
        alt_text: 'Pearl Earrings Set',
        is_primary: true,
        sort_order: 1,
        metadata: {
          size: 198450,
          width: 800,
          height: 600,
          format: 'JPEG'
        },
        tags: ['pearl', 'earrings', 'elegant'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const filteredImages = filters?.category 
      ? mockImages.filter(img => img.tags.includes(filters.category!))
      : mockImages;

    return {
      images: filteredImages,
      total: filteredImages.length,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      total_pages: Math.ceil(filteredImages.length / (filters?.limit || 20))
    };
  }

  private getMockCategoryImages(category: string): JewelryImage[] {
    // Return category-specific mock images
    return this.getMockImages({ category }).images;
  }
}

export const imageService = new ImageService();