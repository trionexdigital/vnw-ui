import { createAsyncThunk, createSlice, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { login as loginAPI, logout as logoutAPI, register as registerAPI } from '@/core/api/authAPI';
import { localService } from '@/core/services/local';

export interface User {
  id: number;
  user_id?: number;
  email: string;
  name?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  mobile?: string;
  logo?: string;
  referral_code?: string;
  status?: string;
  permissions?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const getStoredUser = (): User | null => {
  const userData = localService.getUser();
  try { return userData ? JSON.parse(userData) : null; } catch { return null; }
};

const initialState: AuthState = {
  isAuthenticated: !!localService.getToken(),
  user: getStoredUser(),
  token: localService.getToken(),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await loginAPI(payload);
      return response.user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: any, thunkAPI) => {
    try {
      const response = await registerAPI(payload);
      return response.user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Registration failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      logoutAPI();
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    setAuthSession: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.token = localService.getToken();
      state.isLoading = false;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        const stored = localService.getUser();
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localService.setUser(JSON.stringify({ ...parsed, ...action.payload }));
          } catch { /* ignore */ }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isAnyOf(login.pending, registerUser.pending), (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(isAnyOf(login.fulfilled, registerUser.fulfilled), (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.token = localService.getToken();
      })
      .addMatcher(isAnyOf(login.rejected, registerUser.rejected), (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Action failed';
        if (action.type.includes('login')) {
          state.isAuthenticated = false;
          state.user = null;
        }
      });
  },
});

export const { logout, setAuthSession, updateUser } = authSlice.actions;
export default authSlice.reducer;
