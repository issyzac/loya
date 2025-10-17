// src/api/axios.js
import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: "https://loyaserver.enzi.coffee",
  //baseURL: "http://127.0.0.1:5001",
  timeout: 5000,
});// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add staff token if available
    const staffToken = localStorage.getItem('staffToken');
    if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
    }

    console.log("Request Details:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      params: config.params,
    });
    return config; // Must return the config object to proceed with the request
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error); // Reject the promise if there's an error
  }
);

// Add a response interceptor for token validation
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh the token
      const refreshToken = localStorage.getItem('staffRefreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${axiosInstance.defaults.baseURL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });

          if (refreshResponse.status === 200) {
            const { access_token } = refreshResponse.data;

            // Update stored token
            localStorage.setItem('staffToken', access_token);

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            // Retry the original request
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      // If refresh failed or no refresh token, clear auth data
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffRefreshToken');
      localStorage.removeItem('staffUser');
      localStorage.removeItem('staffPermissions');

      // Redirect to staff login if on staff pages
      if (window.location.pathname.startsWith('/staff')) {
        window.location.href = '/staff/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;