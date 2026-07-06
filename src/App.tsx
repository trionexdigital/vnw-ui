import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import AppRoutes from "./app/router/AppRoutes";
import { Provider } from "react-redux";
import { StrictMode } from "react";
import { store } from './app/store';

export default function App() {
  return (
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <AppRoutes />
          </TooltipProvider>
        </BrowserRouter>
      </Provider>
    </StrictMode>
  );
}
