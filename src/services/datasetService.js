/**
 * Dataset Service - Handles API communication for datasets
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export const datasetService = {
  async listDatasets() {
    if (!API_KEY) {
      throw new Error('API Key not configured');
    }

    const response = await fetch(`${API_BASE_URL}/datasets`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list datasets');
    }

    return await response.json();
  },

  async uploadDataset(file, name = null) {
    if (!API_KEY) {
      throw new Error('API Key not configured');
    }

    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  },

  async activateDataset(datasetId) {
    if (!API_KEY) {
      throw new Error('API Key not configured');
    }

    const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}/activate`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to activate dataset');
    }

    return await response.json();
  },

  async deleteDataset(datasetId) {
    if (!API_KEY) {
      throw new Error('API Key not configured');
    }

    const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete dataset');
    }

    return await response.json();
  },
};
