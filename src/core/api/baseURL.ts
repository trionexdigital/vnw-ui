export const WEB_URL = 'https://store.vipnumberworld.com/vipnumberworld/';
export const LOCAL = 'http://localhost:3002/vipnumberworld/';

// Vite replaces DEV at build time, so production bundles cannot accidentally
// ship with the local API selected by a forgotten manual toggle.
// Set this public URL for HTTPS staging/tunnel tests. Payment credentials belong
// only in the backend environment, never in a VITE_ variable.
const configured = import.meta.env.VITE_API_BASE_URL?.trim();
export const BASE_URL = configured ? configured.replace(/\/+$/, '') + '/' : import.meta.env.DEV ? LOCAL : WEB_URL;
