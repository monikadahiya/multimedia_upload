import axios from 'axios';
import store from '../store/store';
import { logoutLocal, setAccessToken } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send/receive HTTP-only cookies
});

// Attach the in-memory access token as a fallback for clients/proxies that
// strip cookies; the server also accepts it via cookie alone.
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try a silent refresh once, then retry the original request.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry && !config.url.includes('/auth/')) {
      config._retry = true;
      try {
        refreshPromise = refreshPromise || api.post('/auth/refresh');
        const { data } = await refreshPromise;
        refreshPromise = null;
        store.dispatch(setAccessToken(data.accessToken));
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);
      } catch (refreshError) {
        refreshPromise = null;
        store.dispatch(logoutLocal());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
