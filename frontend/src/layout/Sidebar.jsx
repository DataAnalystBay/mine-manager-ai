import { Box, Typography, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";

import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FactoryIcon from "@mui/icons-material/Factory";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";

const API_BASE_URL = "http://127.0.0.1:8000";

const navItems = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Upload Reports", path: "/upload", icon: <CloudUploadIcon /> },
  { label: "Production", path: "/production", icon: <BarChartIcon /> },
  { label: "Fleet", path: "/fleet", icon: <LocalShippingIcon /> },
  { label: "Plant", path: "/plant", icon: <FactoryIcon /> },
  { label: "Safety", path: "/safety", icon: <HealthAndSafetyIcon /> },
  {
    label: "Executive Reports",
    path: "/reports",
    icon: <DescriptionIcon />,
  },
  { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
];

function Sidebar() {
  const { company, mine } = useConfig();

  const companyName = company?.company_name || "Mine Manager AI";
  const mineName = mine?.mine_name || "Demo Mine";

  const primaryColor = company?.primary_color || "#16A34A";
  const secondaryColor = company?.secondary_color || "#1E293B";

  const getLogoUrl = () => {
    if (company?.logo_url?.startsWith("/static")) {
      return `${API_BASE_URL}${company.logo_url}`;
    }

    return company?.logo_url || "/images/logo.png";
  };

  const logoUrl = getLogoUrl();

  return (
    <Box
      sx={{
        width: 270,
        minHeight: "100vh",
        bgcolor: secondaryColor,
        color: "#e5e7eb",
        px: 2.5,
        py: 3,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ mb: 5, px: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            component="img"
            src={logoUrl}
            alt={companyName}
            sx={{
              width: 44,
              height: 44,
              objectFit: "contain",
              bgcolor: "#ffffff",
              borderRadius: "12px",
              p: 0.5,
              border: `1px solid ${primaryColor}55`,
            }}
          />

          <Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "0.2px",
                lineHeight: 1.15,
                color: "#ffffff",
              }}
            >
              {companyName}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "#cbd5e1",
                mt: 0.5,
              }}
            >
              {mineName}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack spacing={1.2}>
        {navItems.map((item) => (
          <Box
            key={item.path}
            component={NavLink}
            to={item.path}
            end={item.path === "/"}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.8,
              px: 2,
              py: 1.45,
              borderRadius: "14px",
              color: "#cbd5e1",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 700,
              transition: "0.2s ease",
              borderLeft: "4px solid transparent",

              "& svg": {
                fontSize: 23,
                color: "#cbd5e1",
              },

              "&:hover": {
                bgcolor: "rgba(255,255,255,0.07)",
                color: "#ffffff",
                transform: "translateX(3px)",
                "& svg": {
                  color: primaryColor,
                },
              },

              "&.active": {
                bgcolor: `${primaryColor}22`,
                color: "#ffffff",
                borderLeft: `4px solid ${primaryColor}`,
                boxShadow: `0 12px 28px ${primaryColor}30`,

                "& svg": {
                  color: primaryColor,
                },
              },
            }}
          >
            {item.icon}
            {item.label}
          </Box>
        ))}
      </Stack>

      <Box
        sx={{
          mt: "auto",
          p: 2,
          borderRadius: "18px",
          bgcolor: "rgba(255,255,255,0.06)",
          border: `1px solid ${primaryColor}33`,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
          Commercial MVP
        </Typography>

        <Typography sx={{ fontSize: 12, color: "#cbd5e1", mt: 0.7 }}>
          Configurable for pilot deployment
        </Typography>

        <Box
          sx={{
            mt: 1.5,
            height: 4,
            width: "100%",
            borderRadius: "999px",
            bgcolor: `${primaryColor}55`,
          }}
        />
      </Box>
    </Box>
  );
}

export default Sidebar;