import LocationProvider from '@/shared/location/LocationProvider';
import { BrowserRouter, useLocation } from "react-router-dom";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import AppRoutes from "./app/router/AppRoutes";
import { Provider } from "react-redux";
import { StrictMode, type ReactNode } from "react";
import { useAppSelector } from '@/app/hooks';
import { store } from './app/store';
import { ThemeProvider } from '@/shared/theme';
import ScrollToTop from '@/app/router/ScrollToTop';

import LanguageProvider from '@/shared/language/LanguageProvider';

function RouteThemeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const allowAppearance = pathname === '/admin' || pathname.startsWith('/admin/') || (user?.role === 'ADMIN' && ['/account', '/change-password', '/notifications'].includes(pathname));
  return <ThemeProvider allowAppearance={allowAppearance}>{children}</ThemeProvider>;
}

export default function App() {
  return (
    <StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <RouteThemeProvider>
            <LanguageProvider>
            <LocationProvider>
            <ScrollToTop />
            <TooltipProvider>
              <Toaster />
              <AppRoutes />
            </TooltipProvider>
            </LocationProvider>
            </LanguageProvider>
          </RouteThemeProvider>
        </Provider>
      </BrowserRouter>
    </StrictMode>
  );
}
