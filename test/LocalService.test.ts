import { afterEach, describe, expect, it, vi } from 'vitest';

import { localService } from '@/core/services/local';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('LocalService auth cleanup', () => {
  it('removes a token without clearing unrelated preferences', () => {
    window.localStorage.setItem('token', 'secret');
    window.localStorage.setItem('vnw_theme', 'dark');
    window.localStorage.setItem('vnw_recently_viewed', '[786]');

    localService.removeToken();

    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('vnw_theme')).toBe('dark');
    expect(window.localStorage.getItem('vnw_recently_viewed')).toBe('[786]');
  });

  it('logout targets authentication entries and preserves the selected theme', () => {
    window.localStorage.setItem('token', 'secret');
    window.localStorage.setItem('user', '{"id":1}');
    window.localStorage.setItem('remember_me_password', 'secret');
    window.localStorage.setItem('vnw_theme', 'dark');
    window.localStorage.setItem('vnw_compare', '[786]');

    localService.logout();

    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
    expect(window.localStorage.getItem('remember_me_password')).toBeNull();
    expect(window.localStorage.getItem('vnw_theme')).toBe('dark');
    expect(window.localStorage.getItem('vnw_compare')).toBe('[786]');
  });
});
