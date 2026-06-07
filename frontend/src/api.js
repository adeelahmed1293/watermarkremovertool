import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Upload videos
export const uploadVideos = async (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Get thumbnail
export const getThumbnailUrl = (videoId) => {
  return `${API_BASE_URL}/thumbnail/${videoId}`;
};

// Preview watermark removal
export const previewRemoval = async (videoId, bbox) => {
  const response = await api.post('/preview', {
    video_id: videoId,
    bbox: {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    },
  });

  return response.data;
};

// Get preview image
export const getPreviewImageUrl = (videoId) => {
  return `${API_BASE_URL}/preview-image/${videoId}`;
};

// Process single video
export const processSingleVideo = async (videoId, bbox) => {
  const response = await api.post('/process', {
    video_id: videoId,
    bbox: {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    },
  });

  return response.data;
};

// Process bulk videos
export const processBulkVideos = async (items) => {
  const formattedItems = items.map((item) => ({
    video_id: item.video_id,
    bbox: {
      x: item.bbox.x,
      y: item.bbox.y,
      width: item.bbox.width,
      height: item.bbox.height,
    },
  }));

  const response = await api.post('/process-bulk', {
    items: formattedItems,
  });

  return response.data;
};

// Download video
export const downloadVideo = (videoId) => {
  return `${API_BASE_URL}/download/${videoId}`;
};

// Get job status
export const getJobStatus = async (videoId) => {
  const response = await api.get(`/status/${videoId}`);
  return response.data;
};

// Cleanup video
export const cleanupVideo = async (videoId) => {
  const response = await api.delete(`/cleanup/${videoId}`);
  return response.data;
};

export default api;
