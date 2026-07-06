import { localService } from '../services/local';
import { httpService } from '../services/http';
import { BASE_URL } from './baseURL';

const LOGIN_URL = BASE_URL + 'auth/login';
const REGISTER_URL = BASE_URL + 'auth/register';
const FORGOT_URL = BASE_URL + 'auth/forgot-request';
const ME_URL = BASE_URL + 'auth/me';
const UPDATE_PROFILE_URL = BASE_URL + 'auth/update-profile';
const CHANGE_PASSWORD_URL = BASE_URL + 'auth/change-password';

export const mapUser = (data: any) => ({
  id: data.user_id,
  user_id: data.user_id,
  email: data.email,
  name: data.full_name || data.name,
  full_name: data.full_name,
  role: data.role,
  phone: data.phone,
  mobile: data.phone,
  logo: data.logo,
  referral_code: data.referral_code,
  status: data.status,
  permissions: Array.isArray(data.permissions) ? data.permissions : [],
});

export const login = async (payload: { email: string; password: string }) => {
  const response = await httpService.postRequest(LOGIN_URL, payload);
  if (response && response.status === 1) {
    delete response.data.password;
    localService.setUser(JSON.stringify(response.data));
    return { user: mapUser(response.data), token: localService.getToken() };
  }
  throw new Error(response?.info || 'Login failed');
};

export const register = async (payload: any) => {
  const response = await httpService.postRequest(REGISTER_URL, payload);
  if (response && response.status === 1) {
    delete response.data.password;
    localService.setUser(JSON.stringify(response.data));
    return { user: mapUser(response.data), token: localService.getToken() };
  }
  throw new Error(response?.info || 'Registration failed');
};

export const forgotPassword = async (payload: { email: string; reason: string }) => {
  const response = await httpService.postRequest(FORGOT_URL, payload);
  if (response && response.status === 1) return response.info;
  throw new Error(response?.info || 'Request failed');
};

export const getMe = async () => {
  const response = await httpService.postRequest(ME_URL, {});
  if (response && response.status === 1) {
    localService.setUser(JSON.stringify(response.data));
    return mapUser(response.data);
  }
  throw new Error(response?.info || 'Unable to load profile');
};

export const updateProfile = async (payload: { name: string; phone?: string; address?: string }) => {
  const response = await httpService.postRequest(UPDATE_PROFILE_URL, payload);
  if (response && response.status === 1) return mapUser(response.data);
  throw new Error(response?.info || 'Update failed');
};

export const changePassword = async (payload: any) => {
  const response = await httpService.postRequest(CHANGE_PASSWORD_URL, payload);
  if (response && response.status === 1) return response.info;
  throw new Error(response?.info || 'Password change failed');
};

export const logout = () => {
  localService.logout();
};
