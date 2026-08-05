import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";

import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BarChartIcon from "@mui/icons-material/BarChart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FactoryIcon from "@mui/icons-material/Factory";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DescriptionIcon from "@mui/icons-material/Description";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import HistoryIcon from "@mui/icons-material/History";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";

import { API_BASE_URL } from "../config/apiConfig";


const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: DashboardIcon,
  },
  {
    label: "Upload Reports",
    path: "/upload",
    icon: CloudUploadIcon,
  },
  {
    label: "Production",
    path: "/production",
    icon: BarChartIcon,
  },
  {
    label: "Fleet",
    path: "/fleet",
    icon: LocalShippingIcon,
  },
  {
    label: "Plant",
    path: "/plant",
    icon: FactoryIcon,
  },
  {
    label: "Safety",
    path: "/safety",
    icon: HealthAndSafetyIcon,
  },
  {
    label: "Executive Actions",
    path: "/executive-actions",
    icon: AssignmentTurnedInIcon,
  },
  {
    label: "Executive Reports",
    path: "/reports",
    icon: DescriptionIcon,
  },
  {
    label: "User Management",
    path: "/users",
    icon: ManageAccountsIcon,
  },
  {
    label: "Audit Trail",
    path: "/audit-trail",
    icon: HistoryIcon,
  },
  {
    label: "System Health",
    path: "/system-health",
    icon: MonitorHeartIcon,
  },
  {
    label: "Support Diagnostics",
    path: "/support-diagnostics",
    icon: SupportAgentIcon,
  },
  {
    label: "Security Center",
    path: "/security-configuration",
    icon: SecurityIcon,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: SettingsIcon,
  },
];


function Sidebar() {
  const { company, mine } = useConfig();

  const companyName =
    company?.company_name || "Mine Manager AI";

  const mineName =
    mine?.mine_name || "Demo Mine";

  const primaryColor =
    company?.primary_color || "#16A34A";

  const secondaryColor =
    company?.secondary_color || "#1E293B";


  const getLogoUrl = () => {
    const configuredLogo = company?.logo_url;

    if (!configuredLogo) {
      return "/images/logo.png";
    }

    if (
      configuredLogo.startsWith("http://") ||
      configuredLogo.startsWith("https://")
    ) {
      return configuredLogo;
    }

    if (configuredLogo.startsWith("/static")) {
      return `${API_BASE_URL}${configuredLogo}`;
    }

    return configuredLogo;
  };


  const logoUrl = getLogoUrl();


  const handleLogoError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/images/logo.png";
  };


  return (
    <Box
      component="aside"
      sx={{
        width: 270,
        minWidth: 270,
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        bgcolor: secondaryColor,
        color: "#e5e7eb",
        px: 2.5,
        py: 3,
        display: "flex",
        flexDirection: "column",
        borderRight:
          "1px solid rgba(255, 255, 255, 0.08)",
        boxSizing: "border-box",

        "&::-webkit-scrollbar": {
          width: 6,
        },

        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },

        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255, 255, 255, 0.16)",
          borderRadius: 999,
        },

        "&::-webkit-scrollbar-thumb:hover": {
          background: "rgba(255, 255, 255, 0.25)",
        },
      }}
    >
      {/* ---------- Company Identity ---------- */}

      <Box
        sx={{
          mb: 5,
          px: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: 0,
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt={`${companyName} logo`}
          onError={handleLogoError}
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            objectFit: "contain",
            bgcolor: "#ffffff",
            borderRadius: "12px",
            p: 0.5,
            border: `1px solid ${primaryColor}55`,
            boxSizing: "border-box",
          }}
        />

        <Box
          sx={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: "0.2px",
              lineHeight: 1.15,
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {companyName}
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 12,
              lineHeight: 1.4,
              color: "#cbd5e1",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mineName}
          </Typography>
        </Box>
      </Box>


      {/* ---------- Navigation ---------- */}

      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
        }}
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <Box
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === "/"}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.8,
                minHeight: 50,
                px: 2,
                py: 1.35,
                borderRadius: "14px",
                borderLeft: "4px solid transparent",
                color: "#cbd5e1",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.35,
                boxSizing: "border-box",
                transition:
                  "background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",

                "& svg": {
                  flexShrink: 0,
                  fontSize: 23,
                  color: "#cbd5e1",
                  transition: "color 0.2s ease",
                },

                "&:hover": {
                  bgcolor:
                    "rgba(255, 255, 255, 0.07)",
                  color: "#ffffff",
                  transform: "translateX(3px)",

                  "& svg": {
                    color: primaryColor,
                  },
                },

                "&.active": {
                  bgcolor: `${primaryColor}22`,
                  color: "#ffffff",
                  borderLeftColor: primaryColor,
                  boxShadow:
                    `0 12px 28px ${primaryColor}30`,

                  "& svg": {
                    color: primaryColor,
                  },
                },

                "&:focus-visible": {
                  outline: `2px solid ${primaryColor}`,
                  outlineOffset: "2px",
                },
              }}
            >
              <IconComponent aria-hidden="true" />

              <Box
                component="span"
                sx={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Box>
            </Box>
          );
        })}
      </Box>


      {/* ---------- MVP Status ---------- */}

      <Box
        sx={{
          mt: "auto",
          pt: 4,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: "18px",
            bgcolor:
              "rgba(255, 255, 255, 0.06)",
            border:
              `1px solid ${primaryColor}33`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              Commercial MVP
            </Typography>

            <Box
              sx={{
                width: 9,
                height: 9,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: primaryColor,
                boxShadow:
                  `0 0 0 4px ${primaryColor}20`,
              }}
            />
          </Box>

          <Typography
            sx={{
              mt: 0.75,
              fontSize: 11.5,
              lineHeight: 1.5,
              color: "#94a3b8",
            }}
          >
            Executive operations intelligence
            platform
          </Typography>

          <Box
            sx={{
              mt: 1.5,
              pt: 1.5,
              borderTop:
                "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: "#cbd5e1",
              }}
            >
              Mine Manager AI · Version 1.0
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


export default Sidebar;