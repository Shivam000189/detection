import api from "./axios";

export const loginApi = (data) => api.post("/login", data);
export const signupApi = (data) => api.post("/register", data);
export const getProfileApi = () => api.get("/me");