// src/api/axios.js
import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  // baseURL: "https://loyaserver.enzi.coffee",  
  baseURL: "http://127.0.0.1:5001",
  timeout: 5000,
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
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

export default axiosInstance;