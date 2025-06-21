// src/api.js
import axios from 'axios';


const API_BASE_URL = 'http://127.0.0.1:8000/api'; 

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
  return apiClient.post('/token/', credentials); 
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
  return apiClient.get('/profile/', { 
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
  return apiClient.get('/routines/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getSpecificRoutineApi = (routineDbId) => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token found. Please log in.'));
  }
  return apiClient.get(`/routines/${routineDbId}/`, { 
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

////////////////////////////////////////////////////////

export const generateWorkoutWithAIApi = (prompt, existingRoutine = null) => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token. Please log in.'));
  }
  const payload = { prompt };
  if (existingRoutine) {
    payload.existing_routine_json = JSON.stringify(existingRoutine); 
  }
  return apiClient.post('/generate-workout/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createNewRoutineApi = (routineData) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  const payload = { ...routineData, is_preset: false };
  return apiClient.post('/routines/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateRoutineApi = (routineDbId, routineData) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  const payload = { ...routineData, is_preset: false };
  return apiClient.put(`/routines/${routineDbId}/`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export const updateUserWorkoutPlanApi = (planData) => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token. Please log in.'));
  }
  return apiClient.patch('/workout-plan/', planData, { 
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getUserWorkoutPlanApi = () => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token. Please log in.'));
  }
  return apiClient.get('/workout-plan/', { 
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

///////////////////////
export const getOrCreateDailyLogApi = (dateString) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  return apiClient.post('/daily-logs/get-or-create-for-date/', { date: dateString }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateDailyLogApi = (logId, logData) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  return apiClient.patch(`/daily-logs/${logId}/`, logData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getWorkoutContributionsApi = () => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    return Promise.reject(new Error('No access token. Please log in.'));
  }
  return apiClient.get('/workout-contributions/', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteTrainingRoutineApi = (routineDbId) => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    return Promise.reject(new Error('No access token. Please log in.'));
  }
  return apiClient.delete(`/routines/${routineDbId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};