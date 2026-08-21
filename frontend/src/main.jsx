import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

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
    <ConfigProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ConfigProvider>
  </StrictMode>
);