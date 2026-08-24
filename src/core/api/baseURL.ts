export const WEB_URL = 'https://store.vipnumberworld.com/vipnumberworld/';
export const LOCAL = 'http://localhost:3002/vipnumberworld/';

// Vite replaces DEV at build time, so production bundles cannot accidentally
// ship with the local API selected by a forgotten manual toggle.
export const BASE_URL = import.meta.env.DEV ? LOCAL : WEB_URL;
