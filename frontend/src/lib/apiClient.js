import axios from "axios";

// En prod: "/api" (reverse proxy nginx)
// En dev local: "http://localhost:8000" (ou 8001 selon ton dev)
const baseURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
export const API = `${baseURL}/api`;

const api = axios.create({
  baseURL: API
});

export default api;