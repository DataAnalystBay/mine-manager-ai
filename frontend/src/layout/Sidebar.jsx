import {
  Box,
  Typography,
} from "@mui/material";

import {
  NavLink,
} from "react-router-dom";

import {
  useConfig,
} from "../context/ConfigContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import useAuth
  from "../hooks/useAuth";


import DashboardIcon
  from "@mui/icons-material/Dashboard";

import CloudUploadIcon
  from "@mui/icons-material/CloudUpload";

import BarChartIcon
  from "@mui/icons-material/BarChart";

import LocalShippingIcon
  from "@mui/icons-material/LocalShipping";

import FactoryIcon
  from "@mui/icons-material/Factory";

import HealthAndSafetyIcon
  from "@mui/icons-material/HealthAndSafety";

import AssignmentTurnedInIcon
  from "@mui/icons-material/AssignmentTurnedIn";

import DescriptionIcon
  from "@mui/icons-material/Description";

import ManageAccountsIcon
  from "@mui/icons-material/ManageAccounts";

import HistoryIcon
  from "@mui/icons-material/History";

import MonitorHeartIcon
  from "@mui/icons-material/MonitorHeart";

import SupportAgentIcon
  from "@mui/icons-material/SupportAgent";

import SecurityIcon
  from "@mui/icons-material/Security";

import SettingsIcon
  from "@mui/icons-material/Settings";


import {
  API_BASE_URL,
} from "../config/apiConfig";

import {
  APP_VERSION,
} from "../config/version";


/* ============================================================
   Navigation Configuration
   ============================================================ */

const navItems = [
  {
    labelKey:
      "navigation.dashboard",

    path:
      "/",

    icon:
      DashboardIcon,
  },

  {
    labelKey:
      "navigation.uploadReports",

    path:
      "/upload",

    icon:
      CloudUploadIcon,
  },

  {
    labelKey:
      "navigation.production",

    path:
      "/production",

    icon:
      BarChartIcon,
  },

  {
    labelKey:
      "navigation.fleet",

    path:
      "/fleet",

    icon:
      LocalShippingIcon,
  },

  {
    labelKey:
      "navigation.plant",

    path:
      "/plant",

    icon:
      FactoryIcon,
  },

  {
    labelKey:
      "navigation.safety",

    path:
      "/safety",

    icon:
      HealthAndSafetyIcon,
  },

  {
    labelKey:
      "navigation.executiveActions",

    path:
      "/executive-actions",

    icon:
      AssignmentTurnedInIcon,
  },

  {
    labelKey:
      "navigation.executiveReports",

    path:
      "/reports",

    icon:
      DescriptionIcon,
  },


  /* =========================================================
     Administrator-only navigation
     ========================================================= */

  {
    labelKey:
      "navigation.userManagement",

    path:
      "/users",

    icon:
      ManageAccountsIcon,

    adminOnly:
      true,
  },

  {
    labelKey:
      "navigation.auditTrail",

    path:
      "/audit-trail",

    icon:
      HistoryIcon,

    adminOnly:
      true,
  },

  {
    labelKey:
      "navigation.systemHealth",

    path:
      "/system-health",

    icon:
      MonitorHeartIcon,

    adminOnly:
      true,
  },

  {
    labelKey:
      "navigation.supportDiagnostics",

    path:
      "/support-diagnostics",

    icon:
      SupportAgentIcon,

    adminOnly:
      true,
  },

  {
    labelKey:
      "navigation.security",

    path:
      "/security-configuration",

    icon:
      SecurityIcon,

    adminOnly:
      true,
  },

  {
    labelKey:
      "navigation.settings",

    path:
      "/settings",

    icon:
      SettingsIcon,

    adminOnly:
      true,
  },
];


/* ============================================================
   Sidebar
   ============================================================ */

function Sidebar() {
  const {
    company,
    mine,
  } = useConfig();

  const {
    user,
  } = useAuth();

  const {
    language,
    t,
  } = useLanguage();


  /* ==========================================================
     Role
     ========================================================== */

  const isAdministrator =
    user?.role ===
    "Administrator";


  const visibleNavItems =
    navItems.filter(
      (item) =>
        !item.adminOnly ||
        isAdministrator
    );


  /* ==========================================================
     Branding
     ========================================================== */

  const companyName =
    company?.company_name ||
    "Mine Manager AI";


  const mineName =
    mine?.mine_name ||
    (
      language === "MN"
        ? "Демо уурхай"
        : "Demo Mine"
    );


  const primaryColor =
    company?.primary_color ||
    "#16A34A";


  /*
   * Application shell colors
   *
   * Keep the Mine Manager AI navigation visually consistent across
   * customers. Customer branding remains available through the company
   * logo, company name, mine name, and configured brand colors elsewhere.
   */
  const sidebarBackground =
    "#1B1917";

  const sidebarText =
    "#F8FAFC";

  const sidebarMutedText =
    "#CBD5E1";

  const sidebarSubtleText =
    "#94A3B8";

  const sidebarAccent =
    "#F97316";

  const sidebarActiveBackground =
    "#382316";


  /* ==========================================================
     Logo
     ========================================================== */

  const getLogoUrl = () => {
    const configuredLogo =
      company?.logo_url;


    if (!configuredLogo) {
      return "/images/logo.png";
    }


    if (
      configuredLogo.startsWith(
        "http://"
      ) ||
      configuredLogo.startsWith(
        "https://"
      )
    ) {
      return configuredLogo;
    }


    if (
      configuredLogo.startsWith(
        "/static"
      )
    ) {
      return `${API_BASE_URL}${configuredLogo}`;
    }


    return configuredLogo;
  };


  const logoUrl =
    getLogoUrl();


  const handleLogoError =
    (event) => {
      event.currentTarget.onerror =
        null;

      event.currentTarget.src =
        "/images/logo.png";
    };


  /* ==========================================================
     Localized supporting text
     ========================================================== */

  const navigationLabel =
    language === "MN"
      ? "Үндсэн цэс"
      : "Main navigation";


  const commercialMvpLabel =
    language === "MN"
      ? "Арилжааны MVP"
      : "Commercial MVP";


  const platformDescription =
    language === "MN"
      ? "Уурхайн удирдлагын мэдээлэл, шинжилгээний платформ"
      : "Executive operations intelligence platform";


  /* ==========================================================
     Render
     ========================================================== */

  return (
    <Box
      component="aside"
      sx={{
        width:
          270,

        minWidth:
          270,

        height:
          "100vh",

        position:
          "sticky",

        top:
          0,

        overflowY:
          "auto",

        bgcolor:
          sidebarBackground,

        color:
          "#e5e7eb",

        px:
          2.5,

        py:
          3,

        display:
          "flex",

        flexDirection:
          "column",

        borderRight:
          "1px solid rgba(255, 255, 255, 0.08)",

        boxSizing:
          "border-box",


        "&::-webkit-scrollbar":
          {
            width:
              6,
          },


        "&::-webkit-scrollbar-track":
          {
            background:
              "transparent",
          },


        "&::-webkit-scrollbar-thumb":
          {
            background:
              "rgba(255, 255, 255, 0.16)",

            borderRadius:
              999,
          },


        "&::-webkit-scrollbar-thumb:hover":
          {
            background:
              "rgba(255, 255, 255, 0.25)",
          },
      }}
    >

      {/* ====================================================
          Company Identity
          ==================================================== */}

      <Box
        sx={{
          mb:
            5,

          px:
            1,

          display:
            "flex",

          alignItems:
            "center",

          gap:
            1.5,

          minWidth:
            0,
        }}
      >

        <Box
          component="img"

          src={
            logoUrl
          }

          alt={
            `${companyName} logo`
          }

          onError={
            handleLogoError
          }

          sx={{
            width:
              44,

            height:
              44,

            flexShrink:
              0,

            objectFit:
              "contain",

            bgcolor:
              "#ffffff",

            borderRadius:
              "12px",

            p:
              0.5,

            border:
              "1px solid rgba(255, 255, 255, 0.18)",

            boxSizing:
              "border-box",
          }}
        />


        <Box
          sx={{
            minWidth:
              0,

            overflow:
              "hidden",
          }}
        >

          <Typography
            sx={{
              fontSize:
                16,

              fontWeight:
                900,

              letterSpacing:
                "0.2px",

              lineHeight:
                1.15,

              color:
                sidebarText,

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",

              whiteSpace:
                "nowrap",
            }}
          >
            {
              companyName
            }
          </Typography>


          <Typography
            sx={{
              mt:
                0.5,

              fontSize:
                12,

              lineHeight:
                1.4,

              color:
                sidebarMutedText,

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",

              whiteSpace:
                "nowrap",
            }}
          >
            {
              mineName
            }
          </Typography>

        </Box>

      </Box>


      {/* ====================================================
          Navigation
          ==================================================== */}

      <Box
        component="nav"

        aria-label={
          navigationLabel
        }

        sx={{
          display:
            "flex",

          flexDirection:
            "column",

          gap:
            1.2,
        }}
      >

        {
          visibleNavItems.map(
            (item) => {
              const IconComponent =
                item.icon;


              return (
                <Box
                  key={
                    item.path
                  }

                  component={
                    NavLink
                  }

                  to={
                    item.path
                  }

                  end={
                    item.path ===
                    "/"
                  }

                  sx={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      1.8,

                    minHeight:
                      50,

                    px:
                      2,

                    py:
                      1.35,

                    borderRadius:
                      "14px",

                    borderLeft:
                      "4px solid transparent",

                    color:
                      sidebarMutedText,

                    textDecoration:
                      "none",

                    fontSize:
                      15,

                    fontWeight:
                      700,

                    lineHeight:
                      1.35,

                    boxSizing:
                      "border-box",

                    transition:
                      "background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",


                    "& svg":
                      {
                        flexShrink:
                          0,

                        fontSize:
                          23,

                        color:
                          sidebarMutedText,

                        transition:
                          "color 0.2s ease",
                      },


                    "&:hover":
                      {
                        bgcolor:
                          "rgba(255, 255, 255, 0.07)",

                        color:
                          "#ffffff",

                        transform:
                          "translateX(3px)",


                        "& svg":
                          {
                            color:
                              sidebarAccent,
                          },
                      },


                    "&.active":
                      {
                        bgcolor:
                          sidebarActiveBackground,

                        color:
                          "#ffffff",

                        borderLeftColor:
                          sidebarAccent,

                        boxShadow:
                          "0 12px 28px rgba(249, 115, 22, 0.12)",


                        "& svg":
                          {
                            color:
                              sidebarAccent,
                          },
                      },


                    "&:focus-visible":
                      {
                        outline:
                          `2px solid ${sidebarAccent}`,

                        outlineOffset:
                          "2px",
                      },
                  }}
                >

                  <IconComponent
                    aria-hidden=
                      "true"
                  />


                  <Box
                    component="span"

                    title={
                      t(
                        item.labelKey
                      )
                    }

                    sx={{
                      minWidth:
                        0,

                      overflow:
                        "hidden",

                      textOverflow:
                        "ellipsis",

                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {
                      t(
                        item.labelKey
                      )
                    }
                  </Box>

                </Box>
              );
            }
          )
        }

      </Box>


      {/* ====================================================
          MVP Status
          ==================================================== */}

      <Box
        sx={{
          mt:
            "auto",

          pt:
            4,
        }}
      >

        <Box
          sx={{
            p:
              2,

            borderRadius:
              "18px",

            bgcolor:
              "rgba(255, 255, 255, 0.06)",

            border:
              "1px solid rgba(249, 115, 22, 0.28)",
          }}
        >

          <Box
            sx={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap:
                1,
            }}
          >

            <Typography
              sx={{
                fontSize:
                  13,

                fontWeight:
                  800,

                color:
                  sidebarText,
              }}
            >
              {
                commercialMvpLabel
              }
            </Typography>


            <Box
              sx={{
                width:
                  9,

                height:
                  9,

                flexShrink:
                  0,

                borderRadius:
                  "50%",

                bgcolor:
                  sidebarAccent,

                boxShadow:
                  "0 0 0 4px rgba(249, 115, 22, 0.12)",
              }}
            />

          </Box>


          <Typography
            sx={{
              mt:
                0.75,

              fontSize:
                11.5,

              lineHeight:
                1.5,

              color:
                sidebarSubtleText,
            }}
          >
            {
              platformDescription
            }
          </Typography>


          <Box
            sx={{
              mt:
                1.5,

              pt:
                1.5,

              borderTop:
                "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >

            <Typography
              sx={{
                fontSize:
                  11,

                fontWeight:
                  700,

                color:
                  sidebarMutedText,
              }}
            >
              {
                `Mine Manager AI · Version ${APP_VERSION}`
              }
            </Typography>

          </Box>

        </Box>

      </Box>

    </Box>
  );
}


export default Sidebar;