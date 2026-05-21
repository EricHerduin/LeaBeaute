import { ViteReactSSG } from "vite-react-ssg";
import routes from "@/routes";
import "@/index.css";

// Exporte createRoot pour vite-react-ssg (build SSG + hydration client)
export const createRoot = ViteReactSSG({ routes });
