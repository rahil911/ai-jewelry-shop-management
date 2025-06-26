'use client';

import React, { useState, useRef } from 'react';
import { 
  PhotoIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  TagIcon,
  SparklesIcon,
  FolderOpenIcon,
  ChartBarIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  useImages, 
  useImageAnalytics, 
  useImageActions,
  useImageSearch
} from '@/lib/hooks/useImages';
import { ImageFilters, JewelryImage } from '@/lib/api/services/images';

type ViewMode = 'grid' | 'list' | 'compact';

export default function GalleryPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<ImageFilters>({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: 1,
    limit: 24
  });

  const { data: imagesData, isLoading, error } = useImages(filters);
  const { data: analytics } = useImageAnalytics();
  const { data: searchResults } = useImageSearch(searchQuery);
  const imageActions = useImageActions();

  const displayImages = searchQuery 
    ? searchResults || []
    : imagesData?.images || [];

  const categories = [
    { id: 'all', name: 'All Categories', count: analytics?.total_images || 0 },
    { id: 'rings', name: 'Rings', count: analytics?.by_category.find(c => c.category === 'rings')?.count || 0 },
    { id: 'necklaces', name: 'Necklaces', count: analytics?.by_category.find(c => c.category === 'necklaces')?.count || 0 },
    { id: 'earrings', name: 'Earrings', count: analytics?.by_category.find(c => c.category === 'earrings')?.count || 0 },
    { id: 'bracelets', name: 'Bracelets', count: analytics?.by_category.find(c => c.category === 'bracelets')?.count || 0 },
    { id: 'bangles', name: 'Bangles', count: analytics?.by_category.find(c => c.category === 'bangles')?.count || 0 }
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length === 1) {
      // Single file upload
      const file = fileArray[0];
      imageActions.uploadImage({
        jewelry_item_id: '1', // Default for now
        file,
        alt_text: file.name.replace(/\.[^/.]+$/, ''),
        is_primary: false,
        tags: [selectedCategory === 'all' ? 'general' : selectedCategory]
      });
    } else {
      // Bulk upload
      imageActions.bulkUploadImages({
        files: fileArray,
        jewelry_item_id: '1' // Default for now
      });
    }
    
    setIsUploadModalOpen(false);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleBulkDelete = () => {
    selectedImages.forEach(id => {
      imageActions.deleteImage(id);
    });
    setSelectedImages([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderImageCard = (image: JewelryImage) => {
    const isSelected = selectedImages.includes(image.id);
    
    if (viewMode === 'list') {
      return (
        <div key={image.id} className={`flex items-center p-4 bg-white border rounded-lg hover:shadow-md transition-shadow ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <div className="relative">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleImageSelection(image.id)}
              className="absolute top-2 left-2 z-10"
            />
            <img
              src={image.url}
              alt={image.alt_text}
              className="w-16 h-16 object-cover rounded-lg"
            />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-900">{image.alt_text}</h3>
            <p className="text-sm text-gray-500">
              {image.metadata.width} × {image.metadata.height} • {formatFileSize(image.metadata.size)}
            </p>
            <div className="flex items-center mt-1">
              {image.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {image.is_primary && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <EyeIcon className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <PencilIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => imageActions.deleteImage(image.id)}
              className="p-2 text-gray-400 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={image.id} className={`relative group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${isSelected ? 'border-blue-500' : 'border-gray-200'}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleImageSelection(image.id)}
          className="absolute top-2 left-2 z-10"
        />
        
        <div className="aspect-square relative">
          <img
            src={image.url}
            alt={image.alt_text}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                <button className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50">
                  <EyeIcon className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50">
                  <PencilIcon className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => imageActions.deleteImage(image.id)}
                  className="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50"
                >
                  <TrashIcon className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-900 truncate">{image.alt_text}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {image.metadata.width} × {image.metadata.height}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-1">
              {image.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {tag}
                </span>
              ))}
              {image.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{image.tags.length - 2}</span>
              )}
            </div>
            {image.is_primary && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage jewelry images with Azure Blob Storage integration
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Images
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PhotoIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Images
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.total_images}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpenIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Categories
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.by_category.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Storage Used
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.storage_used.toFixed(1)} GB
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CloudArrowUpIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Recent Uploads
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {analytics.recent_uploads.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search images by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setFilters({
              ...filters,
              category: e.target.value === 'all' ? undefined : e.target.value,
              page: 1
            });
          }}
          className="select"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.count})
            </option>
          ))}
        </select>

        {/* View Mode */}
        <div className="flex border border-gray-300 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 ${viewMode === 'compact' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ViewColumnsIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button className="btn-secondary btn-sm">
                <TagIcon className="h-4 w-4 mr-2" />
                Add Tags
              </button>
              <button className="btn-secondary btn-sm">
                <SparklesIcon className="h-4 w-4 mr-2" />
                Optimize
              </button>
              <button 
                onClick={handleBulkDelete}
                className="btn-secondary btn-sm text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-200 animate-pulse"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : displayImages.length > 0 ? (
        <div className={`${
          viewMode === 'list' 
            ? 'space-y-4' 
            : viewMode === 'compact'
            ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        }`}>
          {displayImages.map(renderImageCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search terms.' : 'Start by uploading some jewelry images.'}
          </p>
          <div className="mt-6">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Images
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Images</h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to upload
                </button>
                {' '}or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                disabled={imageActions.isLoading}
              >
                {imageActions.isLoading ? 'Uploading...' : 'Choose Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}