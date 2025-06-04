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

export const getSpecificRoutineApi = (routineDbId) => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token found. Please log in.'));
  }
  return apiClient.get(`/routines/${routineDbId}/`, { // Endpoint for specific routine
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

////////////////////////////////////////////////////////

/**
 * Sends a prompt to the backend to generate/modify a workout using AI.
 * @param {string} prompt User's text prompt.
 * @param {object} [existingRoutine] Optional: The current routine object if modifying.
 * @returns {Promise<import('axios').AxiosResponse<any>>} Expected to return AI generated routine data.
 */
export const generateWorkoutWithAIApi = (prompt, existingRoutine = null) => {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('No access token. Please log in.'));
  }
  const payload = { prompt };
  if (existingRoutine) {
    payload.existing_routine_json = JSON.stringify(existingRoutine); // Send as JSON string
  }
  return apiClient.post('/generate-workout/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Functions to save routines (POST for new, PUT for existing)
// These would use your existing /routines/ and /routines/<id>/ endpoints

/**
 * Creates a new training routine.
 * @param {object} routineData The full routine data object.
 * @returns {Promise<import('axios').AxiosResponse<any>>}
 */
export const createNewRoutineApi = (routineData) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  // Ensure is_preset is false or not sent if backend handles it
  const payload = { ...routineData, is_preset: false };
  return apiClient.post('/routines/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Updates an existing training routine.
 * @param {number} routineDbId The database ID of the routine.
 * @param {object} routineData The full routine data object to update with.
 * @returns {Promise<import('axios').AxiosResponse<any>>}
 */
export const updateRoutineApi = (routineDbId, routineData) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  // Ensure is_preset is false or not sent if backend handles it
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
  // The endpoint should be the one that allows PATCH/PUT to the user's specific WorkoutPlan
  return apiClient.patch('/workout-plan/', planData, { // Using PATCH to update specific fields
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
  return apiClient.get('/workout-plan/', { // Your endpoint for the user's workout plan
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

///////////////////////
export const getOrCreateDailyLogApi = (dateString) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  // Assuming your backend has an endpoint that handles get-or-create logic based on date
  // Or you might have separate GET and POST, and handle logic in frontend (more complex)
  // Let's assume a smart endpoint:
  return apiClient.post('/daily-logs/get-or-create-for-date/', { date: dateString }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Alternative:
  // return apiClient.get(`/daily-logs/?date=${dateString}`, { headers: { Authorization: `Bearer ${token}` } });
  // And then if it's a 404, you'd POST to create. The combined endpoint is cleaner.
};

export const updateDailyLogApi = (logId, logData) => {
  const token = getAccessToken();
  if (!token) return Promise.reject(new Error('No access token.'));
  return apiClient.patch(`/daily-logs/${logId}/`, logData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};