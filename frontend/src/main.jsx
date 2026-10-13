import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/theme.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ReaderPrefsProvider } from "./context/ReaderPrefsContext";
import { AppThemeProvider } from "./context/AppThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <AuthProvider>
          <ReaderPrefsProvider>
            <App />
          </ReaderPrefsProvider>
        </AuthProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
