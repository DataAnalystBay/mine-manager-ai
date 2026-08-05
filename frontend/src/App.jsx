import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layout/MainLayout";

/* ---------- Lazy-loaded Pages ---------- */

const Login = lazy(() => import("./pages/Login"));

const Dashboard = lazy(() =>
  import("./pages/Dashboard")
);

const UploadReports = lazy(() =>
  import("./pages/UploadReports")
);

const Production = lazy(() =>
  import("./pages/Production")
);

const Fleet = lazy(() =>
  import("./pages/Fleet")
);

const Plant = lazy(() =>
  import("./pages/Plant")
);

const Safety = lazy(() =>
  import("./pages/Safety")
);

const Settings = lazy(() =>
  import("./pages/Settings")
);

const ExecutiveReports = lazy(() =>
  import("./pages/ExecutiveReports")
);

const ExecutiveActions = lazy(() =>
  import("./pages/ExecutiveActions")
);

const SystemHealth = lazy(() =>
  import("./pages/SystemHealth")
);

const SupportDiagnostics = lazy(() =>
  import("./pages/SupportDiagnostics")
);

const UserManagement = lazy(() =>
  import("./pages/UserManagement")
);

const AuditTrail = lazy(() =>
  import("./pages/AuditTrail")
);

const SecurityConfiguration = lazy(() =>
  import("./pages/SecurityConfiguration")
);

/* ---------- Loading Screen ---------- */

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 16px",
            border: "4px solid #dbeafe",
            borderTop: "4px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />

        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1e3a8a",
          }}
        >
          Loading Mine Manager AI...
        </div>

        <style>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ---------- Application ---------- */

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ---------- Public Routes ---------- */}

            <Route
              path="/login"
              element={<Login />}
            />

            {/* ---------- Protected Routes ---------- */}

            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* ---------- Main Dashboard ---------- */}

              <Route
                path="/"
                element={<Dashboard />}
              />

              {/* ---------- Operational Data ---------- */}

              <Route
                path="/upload"
                element={<UploadReports />}
              />

              <Route
                path="/production"
                element={<Production />}
              />

              <Route
                path="/fleet"
                element={<Fleet />}
              />

              <Route
                path="/plant"
                element={<Plant />}
              />

              <Route
                path="/safety"
                element={<Safety />}
              />

              {/* ---------- Executive Intelligence ---------- */}

              <Route
                path="/reports"
                element={<ExecutiveReports />}
              />

              <Route
                path="/executive-actions"
                element={<ExecutiveActions />}
              />

              {/* ---------- Administration ---------- */}

              <Route
                path="/users"
                element={<UserManagement />}
              />

              <Route
                path="/audit-trail"
                element={<AuditTrail />}
              />

              <Route
                path="/system-health"
                element={<SystemHealth />}
              />

              <Route
                path="/support-diagnostics"
                element={<SupportDiagnostics />}
              />

              <Route
                path="/security-configuration"
                element={<SecurityConfiguration />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;