import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { localService } from './local';
import { Methods } from './methods';

const methods = new Methods();

const apiClient: AxiosInstance = axios.create({
  timeout: 120000, // 2 minutes for large ZIP uploads
});

// 
apiClient.interceptors.request.use((config) => {
  const token = localService.getToken();
  const authKey = methods.getAuthKey();

  if (token && token !== 'undefined') {
    config.headers['token'] = token;
  }
  config.headers['Authorization'] = authKey;

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']; // Delete Header if file upload request is used
  } else {
    config.headers['Content-Type'] = 'application/json; charset=UTF-8';
  }

  return config;
});

export class HttpService {

  async getRequest(url: string) {
    try {
      const response: AxiosResponse = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async postRequest(url: string, payload: any) {
    try {
      const response: AxiosResponse = await apiClient.post(url, payload);
      this.updateToken(response);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Specialized method for files
  async uploadRequest(url: string, formData: FormData) {
    try {
      const response: AxiosResponse = await apiClient.post(url, formData);
      this.updateToken(response);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  // Specialized method for binary downloads
  async downloadRequest(url: string) {
    try {
      const response: AxiosResponse = await apiClient.get(url, { responseType: 'blob' });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private updateToken(response: AxiosResponse) {
    const newToken = response.headers['token'];
    if (newToken) {
      localService.setToken(newToken);
    }
  }

  private handleError(error: any) {
    const status = error.response?.status;
    if (status === 401) {
      alert("Session expired. Logging out.");
      localService.logout();
    }
    throw error;
  }
}

export const httpService = new HttpService();