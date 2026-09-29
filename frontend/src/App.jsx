import {
  Suspense,
  lazy,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute
  from "./components/ProtectedRoute";

import MainLayout
  from "./layout/MainLayout";


/* ============================================================
   Lazy-loaded Pages
   ============================================================ */

const Login = lazy(
  () =>
    import(
      "./pages/Login"
    )
);


const Dashboard = lazy(
  () =>
    import(
      "./pages/Dashboard"
    )
);


const UploadReports = lazy(
  () =>
    import(
      "./pages/UploadReports"
    )
);


const Production = lazy(
  () =>
    import(
      "./pages/Production"
    )
);


const Fleet = lazy(
  () =>
    import(
      "./pages/Fleet"
    )
);


const Plant = lazy(
  () =>
    import(
      "./pages/Plant"
    )
);


const Safety = lazy(
  () =>
    import(
      "./pages/Safety"
    )
);


const Settings = lazy(
  () =>
    import(
      "./pages/Settings"
    )
);


const ExecutiveReports = lazy(
  () =>
    import(
      "./pages/ExecutiveReports"
    )
);


const ExecutiveActions = lazy(
  () =>
    import(
      "./pages/ExecutiveActions"
    )
);


const SystemHealth = lazy(
  () =>
    import(
      "./pages/SystemHealth"
    )
);


const SupportDiagnostics = lazy(
  () =>
    import(
      "./pages/SupportDiagnostics"
    )
);


const UserManagement = lazy(
  () =>
    import(
      "./pages/UserManagement"
    )
);


const AuditTrail = lazy(
  () =>
    import(
      "./pages/AuditTrail"
    )
);


const SecurityConfiguration = lazy(
  () =>
    import(
      "./pages/SecurityConfiguration"
    )
);


/* ============================================================
   Loading Screen
   ============================================================ */

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        background:
          "#f4f7fb",
      }}
    >
      <div
        style={{
          textAlign:
            "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin:
              "0 auto 16px",
            border:
              "4px solid #dbeafe",
            borderTop:
              "4px solid #2563eb",
            borderRadius:
              "50%",
            animation:
              "spin 1s linear infinite",
          }}
        />

        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color:
              "#1e3a8a",
          }}
        >
          Loading Mine Manager AI...
        </div>

        <style>
          {`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
      </div>
    </div>
  );
}


/* ============================================================
   Administrator Route Helper
   ============================================================ */

function AdminRoute({
  children,
}) {
  return (
    <ProtectedRoute
      allowedRoles={[
        "Administrator",
      ]}
    >
      {children}
    </ProtectedRoute>
  );
}


/* ============================================================
   Application
   ============================================================ */

function App() {
  return (
      <BrowserRouter>
        <Suspense
          fallback={
            <PageLoader />
          }
        >
          <Routes>

            {/* ===============================================
                Public Routes
                =============================================== */}

            <Route
              path="/login"
              element={
                <Login />
              }
            />


            {/* ===============================================
                Authenticated Application
                =============================================== */}

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >

              {/* =============================================
                  Main Dashboard
                  ============================================= */}

              <Route
                index
                element={
                  <Dashboard />
                }
              />


              {/* =============================================
                  Operational Data
                  ============================================= */}

              <Route
                path="upload"
                element={
                  <UploadReports />
                }
              />


              <Route
                path="production"
                element={
                  <Production />
                }
              />


              <Route
                path="fleet"
                element={
                  <Fleet />
                }
              />


              <Route
                path="plant"
                element={
                  <Plant />
                }
              />


              <Route
                path="safety"
                element={
                  <Safety />
                }
              />


              {/* =============================================
                  Executive Intelligence
                  ============================================= */}

              <Route
                path="reports"
                element={
                  <ExecutiveReports />
                }
              />


              <Route
                path="executive-actions"
                element={
                  <ExecutiveActions />
                }
              />


              {/* =============================================
                  Administrator Routes
                  ============================================= */}

              <Route
                path="users"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                }
              />


              <Route
                path="audit-trail"
                element={
                  <AdminRoute>
                    <AuditTrail />
                  </AdminRoute>
                }
              />


              <Route
                path="system-health"
                element={
                  <AdminRoute>
                    <SystemHealth />
                  </AdminRoute>
                }
              />


              <Route
                path="support-diagnostics"
                element={
                  <AdminRoute>
                    <SupportDiagnostics />
                  </AdminRoute>
                }
              />


              <Route
                path="security-configuration"
                element={
                  <AdminRoute>
                    <SecurityConfiguration />
                  </AdminRoute>
                }
              />


              <Route
                path="settings"
                element={
                  <AdminRoute>
                    <Settings />
                  </AdminRoute>
                }
              />

              <Route
                path="*"
                element={
                  <Navigate
                    to="/app"
                    replace
                  />
                }
              />

            </Route>

            {/* Legacy root routes retained for existing bookmarks. */}
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/upload" element={<Navigate to="/app/upload" replace />} />
            <Route path="/production" element={<Navigate to="/app/production" replace />} />
            <Route path="/fleet" element={<Navigate to="/app/fleet" replace />} />
            <Route path="/plant" element={<Navigate to="/app/plant" replace />} />
            <Route path="/safety" element={<Navigate to="/app/safety" replace />} />
            <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
            <Route path="/executive-actions" element={<Navigate to="/app/executive-actions" replace />} />
            <Route path="/users" element={<Navigate to="/app/users" replace />} />
            <Route path="/audit-trail" element={<Navigate to="/app/audit-trail" replace />} />
            <Route path="/system-health" element={<Navigate to="/app/system-health" replace />} />
            <Route path="/support-diagnostics" element={<Navigate to="/app/support-diagnostics" replace />} />
            <Route path="/security-configuration" element={<Navigate to="/app/security-configuration" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
  );
}


export default App;
