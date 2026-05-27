import axios from 'axios';

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.detail && typeof error.response.data.detail === 'string') {
      const msg = error.response.data.detail;
      if (msg.includes('429') || msg.includes('Rate limit reached')) {
        error.response.data.detail = "⏳ AI Rate Limit Reached. Please wait a few minutes before trying again.";
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser    = (data) => API.post('/auth/register', data);
export const loginUser       = (data) => API.post('/auth/login', data);
export const uploadDocument  = (formData) => API.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000 });
export const getDocuments    = () => API.get('/documents');
export const deleteDocument  = (id) => API.delete(`/documents/${id}`);
export const askQuestion     = (session_id, question) => API.post('/ask', { session_id, question });
export const getChatHistory  = (session_id) => API.get(`/history/${session_id}`);
export const suggestQuestions = (session_id) => API.post('/suggest-questions', { session_id });
export const addBookmark     = (data) => API.post('/bookmarks', data);
export const getBookmarks    = () => API.get('/bookmarks');
export const deleteBookmark  = (id) => API.delete(`/bookmarks/${id}`);