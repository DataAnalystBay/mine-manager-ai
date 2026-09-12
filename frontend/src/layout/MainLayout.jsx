import {
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(
    theme.breakpoints.down("sm")
  );
  const [mobileNavigationOpen, setMobileNavigationOpen] =
    useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#f5f7fb",
      }}
    >
      {!isMobile && <Sidebar />}

      {isMobile && (
        <Drawer
          open={mobileNavigationOpen}
          onClose={() => setMobileNavigationOpen(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: 270,
                overflow: "hidden",
              },
            },
          }}
        >
          <Sidebar
            onNavigate={() => setMobileNavigationOpen(false)}
          />
        </Drawer>
      )}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {isMobile && (
          <Box
            sx={{
              minHeight: 56,
              px: 1.5,
              display: "flex",
              alignItems: "center",
              bgcolor: "#ffffff",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <IconButton
              aria-label="Open main navigation"
              onClick={() => setMobileNavigationOpen(true)}
              edge="start"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}

        <Box
          component="main"
          sx={{
            flex: 1,
            px: {
              xs: 2,
              sm: 4,
            },
            pt: 2.5,
            pb: 3,
            overflow: "auto",
            bgcolor: "#f5f7fb",
          }}
        >
          <Box
            sx={{
              width: "100%",
              mx: "auto",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
