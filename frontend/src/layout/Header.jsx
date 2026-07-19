import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Stack,
  Divider,
} from "@mui/material";

import useAuth from "../hooks/useAuth";
import { useConfig } from "../context/ConfigContext";

const API_BASE_URL = "http://127.0.0.1:8000";

function Header() {
  const { user, logout } = useAuth();
  const { company, mine, loading } = useConfig();

  const companyName = company?.company_name || "Mine Manager AI";
  const mineName =
    mine?.mine_name || "Executive Operations Intelligence Platform";

  const primaryColor = company?.primary_color || "#16A34A";
  const secondaryColor = company?.secondary_color || "#1E293B";

  const getLogoUrl = () => {
    if (company?.logo_url?.startsWith("/static")) {
      return `${API_BASE_URL}${company.logo_url}`;
    }

    return company?.logo_url || "/images/logo.png";
  };

  const logoUrl = getLogoUrl();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        height: 76,
        px: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          component="img"
          src={logoUrl}
          alt={`${companyName} Logo`}
          sx={{
            width: 44,
            height: 44,
            objectFit: "contain",
            borderRadius: "12px",
            border: `1px solid ${primaryColor}33`,
            bgcolor: "#ffffff",
            p: 0.6,
          }}
        />

        <Box>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 800,
              color: secondaryColor,
              lineHeight: 1.1,
            }}
          >
            {loading ? "Loading..." : companyName}
          </Typography>

          <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.4 }}>
            {mineName}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2.5} alignItems="center">
        <Chip
          label="Version 1.0"
          sx={{
            bgcolor: `${primaryColor}22`,
            color: primaryColor,
            fontWeight: 800,
            borderRadius: "999px",
            height: 34,
          }}
        />

        <Divider orientation="vertical" flexItem sx={{ borderColor: "#e5e7eb" }} />

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: primaryColor,
              color: "#ffffff",
              width: 42,
              height: 42,
              fontWeight: 800,
            }}
          >
            {user?.full_name?.charAt(0) || "U"}
          </Avatar>

          <Box sx={{ minWidth: 150 }}>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 800,
                color: secondaryColor,
              }}
            >
              {user?.full_name || "User"}
            </Typography>

            <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3 }}>
              {user?.role || "Viewer"}
            </Typography>
          </Box>
        </Stack>

        <Button
          onClick={handleLogout}
          sx={{
            height: 38,
            px: 2.2,
            borderRadius: "12px",
            border: "1px solid #fecaca",
            color: "#dc2626",
            bgcolor: "#ffffff",
            fontWeight: 800,
            fontSize: 13,
            "&:hover": {
              bgcolor: "#fef2f2",
              borderColor: "#fca5a5",
            },
          }}
        >
          Logout
        </Button>
      </Stack>
    </Box>
  );
}

export default Header;