import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  ConfigProvider,
} from "./context/ConfigContext";

import {
  LanguageProvider,
} from "./context/LanguageContext";


createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <AuthProvider>
      <ConfigProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ConfigProvider>
    </AuthProvider>
  </StrictMode>
);