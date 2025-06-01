// src/api.js
import axios from 'axios';


const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Your Django API base URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get the access token from sessionStorage
const getAccessToken = () => sessionStorage.getItem('accessToken');

// API calls
export const registerUserApi = (userData) => {
  return apiClient.post('/register/', userData);
};

export const loginUserApi = (credentials) => {
  return apiClient.post('/token/', credentials); // Django simplejwt endpoint
};

export const createProfileApi = (profileData) => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token found for profile creation.'));
  }
  return apiClient.post('/profile/create/', profileData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export const getProfileApi = () => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token found. Please log in.'));
  }
  return apiClient.get('/profile/', { // Assuming your GET endpoint for profile is /api/profile/
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


export default apiClient;

//////////////////////////////////////////////////////

export const getTrainingRoutinesApi = () => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token found. Please log in.'));
  }
  return apiClient.get('/routines/', { // Your endpoint for listing routines
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};