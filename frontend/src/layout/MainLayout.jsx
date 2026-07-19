import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f7fb", display: "flex" }}>
      <Sidebar />

      <Box sx={{ flex: 1 }}>
        <Header />
        <Box sx={{ p: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;