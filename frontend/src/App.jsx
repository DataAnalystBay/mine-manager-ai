import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layout/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UploadReports from "./pages/UploadReports";
import Production from "./pages/Production";
import Fleet from "./pages/Fleet";
import Plant from "./pages/Plant";
import Safety from "./pages/Safety";
import Settings from "./pages/Settings";
import ExecutiveReports from "./pages/ExecutiveReports";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadReports />} />
            <Route path="/production" element={<Production />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/plant" element={<Plant />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/reports" element={<ExecutiveReports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;