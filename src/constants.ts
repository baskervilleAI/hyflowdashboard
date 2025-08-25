// Centralized constants for node and handle styling
export const DEFAULT_HANDLE_COLOR = "#444";
export const HANDLE_PADDING = 0.06;
export const DEFAULT_NODE_TITLE = "Node";

// Image search and processing settings
export const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "";
export const UNSPLASH_API_URL = "https://api.unsplash.com/search/photos";

// Limits for manual image uploads to keep storage light
export const MAX_IMAGE_DIMENSION = 800; // px
export const IMAGE_QUALITY = 0.8; // 80% JPEG quality
