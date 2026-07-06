export class LocalService {
  private static instance: LocalService;
  public spinner: boolean = false;

  private constructor() {}

  public static getInstance(): LocalService {
    if (!LocalService.instance) {
      LocalService.instance = new LocalService();
    }
    return LocalService.instance;
  }

  // JWT TOKEN METHODS
  public setToken(token: string) {
    localStorage.setItem('token', token);
    return true;
  }

  public getToken() {
    return localStorage.getItem('token');
  }

  public removeToken() {
    localStorage.removeItem('token');
    localStorage.clear();
  }

  // Storage Methods
  public setUser(user: string) {
    localStorage.setItem('user', user);
    return true;
  }

  public getUser() {
    return localStorage.getItem('user') || '';
  }

  public setStorageItem(key: string, value: string) {
    localStorage.setItem(key.trim().toLowerCase(), value);
  }

  public getStorageItem(key: string) {
    return localStorage.getItem(key.trim().toLowerCase()) || '';
  }

  public logout() {
    localStorage.removeItem('remember_me_password');
    localStorage.clear();
    window.location.href = '/';
  }
}

export const localService = LocalService.getInstance();