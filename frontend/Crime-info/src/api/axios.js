import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
});

// ✅ ADD THIS INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or your key

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;