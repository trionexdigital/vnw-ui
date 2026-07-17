// API base URL for the VIP Number World backend.
// Toggle isLocal for local development vs. production.

const isLocal = false; // set to false for production builds

export const WEB_URL = 'https://vnw-server.onrender.com/vipnumberworld/';
export const LOCAL = 'http://localhost:3002/vipnumberworld/';

export const BASE_URL = isLocal ? LOCAL : WEB_URL;
