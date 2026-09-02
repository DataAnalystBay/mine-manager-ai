import {
  Box,
  Collapse,
  Typography,
} from "@mui/material";

import {
  useState,
} from "react";

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

import LanguageIcon
  from "@mui/icons-material/Language";

import LogoutIcon
  from "@mui/icons-material/Logout";

import KeyboardArrowDownIcon
  from "@mui/icons-material/KeyboardArrowDown";

import KeyboardArrowUpIcon
  from "@mui/icons-material/KeyboardArrowUp";


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
  const [
    accountOpen,
    setAccountOpen,
  ] = useState(false);

  const {
    company,
    mine,
  } = useConfig();

  const {
    user,
    logout,
  } = useAuth();

  const {
    language,
    setLanguage,
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


  /* ==========================================================
     Logout
     ========================================================== */

  const handleLogout = () => {
    logout();

    window.location.href =
      "/login";
  };


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
          Collapsible Account / Status Panel
          ==================================================== */}

      <Box
        sx={{
          mt:
            "auto",

          pt:
            3,
        }}
      >

        <Box
          sx={{
            borderRadius:
              "18px",

            bgcolor:
              "#171717",

            border:
              "1px solid rgba(255, 255, 255, 0.18)",

            boxShadow:
              "0 12px 30px rgba(0, 0, 0, 0.22)",

            overflow:
              "hidden",
          }}
        >

          {/* =================================================
              User Profile Trigger
              ================================================= */}

          <Box
            component="button"

            type="button"

            onClick={() =>
              setAccountOpen(
                (open) => !open
              )
            }

            aria-expanded={
              accountOpen
            }

            aria-controls=
              "sidebar-account-panel"

            sx={{
              width:
                "100%",

              minHeight:
                60,

              px:
                1.25,

              py:
                1,

              border:
                0,

              bgcolor:
                "transparent",

              color:
                "inherit",

              display:
                "flex",

              alignItems:
                "center",

              minWidth:
                0,

              gap:
                0.7,

              fontFamily:
                "inherit",

              textAlign:
                "left",

              cursor:
                "pointer",

              boxSizing:
                "border-box",

              transition:
                "background-color 0.18s ease",


              "&:hover":
                {
                  bgcolor:
                    "rgba(255, 255, 255, 0.038)",
                },


              "&:focus-visible":
                {
                  outline:
                    `2px solid ${sidebarAccent}`,

                  outlineOffset:
                    "-2px",
                },
            }}
          >

            <Box
              sx={{
                width:
                  31,

                height:
                  31,

                flexShrink:
                  0,

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                bgcolor:
                  "#16A34A",

                color:
                  "#ffffff",

                fontSize:
                  12,

                fontWeight:
                  900,

                lineHeight:
                  1,

                boxShadow:
                  "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
              }}
            >
              {
                user?.full_name
                  ?.trim()
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "U"
              }
            </Box>


            <Box
              sx={{
                flex:
                  1,

                minWidth:
                  0,
              }}
            >

              <Typography
                title={
                  user?.full_name ||
                  (
                    language === "MN"
                      ? "Хэрэглэгч"
                      : "User"
                  )
                }

                sx={{
                  fontSize:
                    11.2,

                  fontWeight:
                    900,

                  lineHeight:
                    1.2,

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
                  user?.full_name ||
                  (
                    language === "MN"
                      ? "Хэрэглэгч"
                      : "User"
                  )
                }
              </Typography>


              <Typography
                title={
                  user?.role ||
                  (
                    language === "MN"
                      ? "Үзэгч"
                      : "Viewer"
                  )
                }

                sx={{
                  mt:
                    0.25,

                  fontSize:
                    9.7,

                  fontWeight:
                    500,

                  lineHeight:
                    1.2,

                  color:
                    sidebarSubtleText,

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",
                }}
              >
                {
                  user?.role ||
                  (
                    language === "MN"
                      ? "Үзэгч"
                      : "Viewer"
                  )
                }
              </Typography>

            </Box>


            {
              accountOpen
                ? (
                  <KeyboardArrowDownIcon
                    aria-hidden="true"

                    sx={{
                      flexShrink:
                        0,

                      fontSize:
                        18,

                      color:
                        "#D1D5DB",
                    }}
                  />
                )
                : (
                  <KeyboardArrowUpIcon
                    aria-hidden="true"

                    sx={{
                      flexShrink:
                        0,

                      fontSize:
                        18,

                      color:
                        "#D1D5DB",
                    }}
                  />
                )
            }

          </Box>


          <Collapse
            in={
              accountOpen
            }

            timeout="auto"

            unmountOnExit
          >

            <Box
              id="sidebar-account-panel"

              sx={{
                px:
                  1.4,

                pb:
                  1.4,
              }}
            >


              <Box
                sx={{
                  mb:
                    1.35,

                  height:
                    "1px",

                  bgcolor:
                    "rgba(255, 255, 255, 0.075)",
                }}
              />


              {/* Commercial MVP / Version / Online Status */}

              <Box
                sx={{
                  minHeight:
                    22,

                  display:
                    "flex",

                  alignItems:
                    "center",

                  minWidth:
                    0,
                }}
              >

                <Typography
                  sx={{
                    flex:
                      1,

                    minWidth:
                      0,

                    fontSize:
                      12.2,

                    fontWeight:
                      900,

                    lineHeight:
                      1.2,

                    color:
                      sidebarText,

                    whiteSpace:
                      "nowrap",

                    overflow:
                      "hidden",

                    textOverflow:
                      "ellipsis",

                    letterSpacing:
                      "0.05px",
                  }}
                >
                  {
                    commercialMvpLabel
                  }
                </Typography>


                <Typography
                  sx={{
                    ml:
                      0.7,

                    flexShrink:
                      0,

                    fontSize:
                      10.2,

                    fontWeight:
                      700,

                    lineHeight:
                      1,

                    color:
                      "#8993A1",
                  }}
                >
                  {
                    `v${APP_VERSION}`
                  }
                </Typography>


                <Box
                  title={
                    language === "MN"
                      ? "Систем онлайн"
                      : "System online"
                  }

                  aria-label={
                    language === "MN"
                      ? "Систем онлайн"
                      : "System online"
                  }

                  sx={{
                    width:
                      8,

                    height:
                      8,

                    ml:
                      1,

                    flexShrink:
                      0,

                    borderRadius:
                      "50%",

                    bgcolor:
                      "#22C55E",

                    boxShadow:
                      "0 0 0 3px rgba(34, 197, 94, 0.10)",
                  }}
                />

              </Box>


              {/* Language Selector */}

              <Box
                sx={{
                  mt:
                    1.25,

                  display:
                    "grid",

                  gridTemplateColumns:
                    "minmax(0, 1fr) minmax(0, 1fr)",

                  gap:
                    0.85,
                }}
              >

                {
                  [
                    {
                      value: "EN",
                      label: "EN",
                    },
                    {
                      value: "MN",
                      label: "МОН",
                    },
                  ].map(
                    (option) => (
                      <Box
                        key={
                          option.value
                        }

                        component="button"

                        type="button"

                        onClick={() =>
                          setLanguage(
                            option.value
                          )
                        }

                        aria-pressed={
                          language ===
                          option.value
                        }

                        sx={{
                          width:
                            "100%",

                          minWidth:
                            0,

                          height:
                            38,

                          px:
                            0.8,

                          border:
                            language === option.value
                              ? `1px solid ${sidebarAccent}`
                              : "1px solid rgba(255, 255, 255, 0.10)",

                          borderRadius:
                            "10px",

                          bgcolor:
                            language === option.value
                              ? "rgba(249, 115, 22, 0.07)"
                              : "rgba(255, 255, 255, 0.018)",

                          color:
                            language === option.value
                              ? sidebarAccent
                              : "#A5ABB5",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          gap:
                            0.6,

                          fontFamily:
                            "inherit",

                          cursor:
                            "pointer",

                          boxSizing:
                            "border-box",

                          transition:
                            "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease",


                          "&:hover":
                            {
                              bgcolor:
                                language === option.value
                                  ? "rgba(249, 115, 22, 0.11)"
                                  : "rgba(255, 255, 255, 0.05)",

                              borderColor:
                                language === option.value
                                  ? sidebarAccent
                                  : "rgba(255, 255, 255, 0.17)",
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

                        <LanguageIcon
                          sx={{
                            fontSize:
                              16,
                          }}
                        />


                        <Box
                          component="span"

                          sx={{
                            fontSize:
                              11,

                            fontWeight:
                              900,

                            lineHeight:
                              1,

                            letterSpacing:
                              "0.2px",
                          }}
                        >
                          {
                            option.label
                          }
                        </Box>

                      </Box>
                    )
                  )
                }

              </Box>


              <Box
                sx={{
                  my:
                    1.35,

                  height:
                    "1px",

                  bgcolor:
                    "rgba(255, 255, 255, 0.075)",
                }}
              />


              {/* Logout */}

              <Box
                component="button"

                type="button"

                onClick={
                  handleLogout
                }

                sx={{
                  width:
                    "100%",

                  minHeight:
                    38,

                  px:
                    1.1,

                  border:
                    "1px solid rgba(255, 255, 255, 0.075)",

                  borderRadius:
                    "11px",

                  bgcolor:
                    "rgba(255, 255, 255, 0.018)",

                  color:
                    "#EF5A61",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    0.8,

                  fontFamily:
                    "inherit",

                  fontSize:
                    10.8,

                  fontWeight:
                    800,

                  textAlign:
                    "left",

                  cursor:
                    "pointer",

                  boxSizing:
                    "border-box",

                  transition:
                    "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease",


                  "&:hover":
                    {
                      bgcolor:
                        "rgba(239, 68, 68, 0.07)",

                      borderColor:
                        "rgba(239, 68, 68, 0.25)",

                      color:
                        "#FF5963",
                    },


                  "&:focus-visible":
                    {
                      outline:
                        "2px solid #ef4444",

                      outlineOffset:
                        "2px",
                    },
                }}
              >

                <LogoutIcon
                  sx={{
                    flexShrink:
                      0,

                    fontSize:
                      16,
                  }}
                />


                <Box
                  component="span"
                >
                  {
                    t(
                      "navigation.logout"
                    )
                  }
                </Box>

              </Box>

            </Box>

          </Collapse>

        </Box>

      </Box>

    </Box>
  );
}


export default Sidebar;
