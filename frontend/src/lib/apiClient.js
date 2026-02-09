import axios from "axios";

// si REACT_APP_BACKEND_URL n'est pas défini ou vide -> appels relatifs "/api"
// si REACT_APP_BACKEND_URL inclut déjà "/api" -> ne pas le dupliquer
// si REACT_APP_BACKEND_URL pointe vers localhost en prod -> forcer "/api"
const rawBaseUrl = (process.env.REACT_APP_BACKEND_URL ?? "").trim();
const envBaseUrl = rawBaseUrl.replace(/\/$/, "");
const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
const looksLocalEnv = /localhost|127\.0\.0\.1/.test(envBaseUrl);
const resolvedBaseUrl = envBaseUrl === "" || (looksLocalEnv && !isLocalHost) ? "" : envBaseUrl;
const hasApiSuffix = /\/api$/.test(resolvedBaseUrl);
export const API = resolvedBaseUrl === "" ? "/api" : (hasApiSuffix ? resolvedBaseUrl : `${resolvedBaseUrl}/api`);

const api = axios.create({ baseURL: API });

export default api;