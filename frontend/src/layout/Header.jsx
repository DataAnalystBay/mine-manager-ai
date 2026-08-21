import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import useAuth
  from "../hooks/useAuth";

import {
  useConfig,
} from "../context/ConfigContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import {
  API_BASE_URL,
} from "../config/apiConfig";

import {
  APP_VERSION,
} from "../config/version";


function Header() {
  const {
    user,
    logout,
  } = useAuth();

  const {
    company,
    mine,
    loading,
  } = useConfig();

  const {
    language,
    setLanguage,
    t,
  } = useLanguage();


  /* ============================================================
     Branding
     ============================================================ */

  const companyName =
    company?.company_name ||
    "Mine Manager AI";

  const mineName =
    mine?.mine_name ||
    (
      language === "MN"
        ? "Уурхайн удирдлагын мэдээллийн платформ"
        : "Executive Operations Intelligence Platform"
    );

  const primaryColor =
    company?.primary_color ||
    "#16A34A";

  const secondaryColor =
    company?.secondary_color ||
    "#1E293B";


  /* ============================================================
     Logo
     ============================================================ */

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


  /* ============================================================
     Logout
     ============================================================ */

  const handleLogout = () => {
    logout();

    window.location.href =
      "/login";
  };


  /* ============================================================
     User
     ============================================================ */

  const userInitial =
    user?.full_name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  /* ============================================================
     Render
     ============================================================ */

  return (
    <Box
      component="header"
      sx={{
        minHeight: 76,
        px: 4,

        display: "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",

        gap: 3,

        bgcolor:
          "#ffffff",

        borderBottom:
          "1px solid #e5e7eb",

        boxShadow:
          "0 1px 10px rgba(15, 23, 42, 0.04)",

        boxSizing:
          "border-box",

        position:
          "relative",

        zIndex:
          10,
      }}
    >

      {/* =======================================================
          Company identity
          ======================================================= */}

      <Box
        sx={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            2,

          minWidth:
            0,

          flex:
            1,
        }}
      >
        <Box
          component="img"
          src={logoUrl}
          alt={`${companyName} logo`}
          onError={
            handleLogoError
          }
          sx={{
            width:
              44,

            height:
              44,

            minWidth:
              44,

            objectFit:
              "contain",

            borderRadius:
              "12px",

            border:
              `1px solid ${primaryColor}33`,

            bgcolor:
              "#ffffff",

            p:
              0.6,

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
                22,

              fontWeight:
                800,

              color:
                secondaryColor,

              lineHeight:
                1.1,

              whiteSpace:
                "nowrap",

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",
            }}
          >
            {
              loading
                ? t(
                    "common.loading"
                  )
                : companyName
            }
          </Typography>

          <Typography
            sx={{
              mt:
                0.4,

              fontSize:
                13,

              color:
                "#64748b",

              lineHeight:
                1.3,

              whiteSpace:
                "nowrap",

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",
            }}
          >
            {mineName}
          </Typography>
        </Box>
      </Box>


      {/* =======================================================
          Header actions
          ======================================================= */}

      <Box
        sx={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            1.5,

          flexShrink:
            0,
        }}
      >

        {/* =====================================================
            Version
            ===================================================== */}

        <Chip
          label={
            `Version ${APP_VERSION}`
          }
          sx={{
            height:
              34,

            bgcolor:
              `${primaryColor}22`,

            color:
              primaryColor,

            fontWeight:
              800,

            borderRadius:
              "999px",

            "& .MuiChip-label":
              {
                px:
                  2,
              },
          }}
        />


        {/* =====================================================
            Language Switch
            ===================================================== */}

        <Box
          role="group"
          aria-label={
            t(
              "common.language"
            )
          }
          sx={{
            display:
              "flex",

            alignItems:
              "center",

            height:
              36,

            p:
              "3px",

            border:
              "1px solid #dbe3ee",

            borderRadius:
              "11px",

            bgcolor:
              "#f8fafc",
          }}
        >
          <Button
            type="button"
            onClick={() =>
              setLanguage(
                "EN"
              )
            }
            aria-pressed={
              language ===
              "EN"
            }
            sx={{
              minWidth:
                46,

              height:
                28,

              px:
                1.2,

              borderRadius:
                "8px",

              color:
                language ===
                "EN"
                  ? "#ffffff"
                  : "#64748b",

              bgcolor:
                language ===
                "EN"
                  ? primaryColor
                  : "transparent",

              fontSize:
                12,

              fontWeight:
                800,

              textTransform:
                "none",

              "&:hover": {
                bgcolor:
                  language ===
                  "EN"
                    ? primaryColor
                    : "#e2e8f0",
              },
            }}
          >
            EN
          </Button>

          <Button
            type="button"
            onClick={() =>
              setLanguage(
                "MN"
              )
            }
            aria-pressed={
              language ===
              "MN"
            }
            sx={{
              minWidth:
                50,

              height:
                28,

              px:
                1.2,

              borderRadius:
                "8px",

              color:
                language ===
                "MN"
                  ? "#ffffff"
                  : "#64748b",

              bgcolor:
                language ===
                "MN"
                  ? primaryColor
                  : "transparent",

              fontSize:
                12,

              fontWeight:
                800,

              textTransform:
                "none",

              "&:hover": {
                bgcolor:
                  language ===
                  "MN"
                    ? primaryColor
                    : "#e2e8f0",
              },
            }}
          >
            МОН
          </Button>
        </Box>


        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx:
              0.5,

            borderColor:
              "#e5e7eb",
          }}
        />


        {/* =====================================================
            User
            ===================================================== */}

        <Box
          sx={{
            display:
              "flex",

            alignItems:
              "center",

            gap:
              1.5,
          }}
        >
          <Avatar
            sx={{
              width:
                42,

              height:
                42,

              bgcolor:
                primaryColor,

              color:
                "#ffffff",

              fontWeight:
                800,

              fontSize:
                18,
            }}
          >
            {userInitial}
          </Avatar>

          <Box
            sx={{
              minWidth:
                130,

              maxWidth:
                210,
            }}
          >
            <Typography
              sx={{
                fontSize:
                  15,

                fontWeight:
                  800,

                color:
                  secondaryColor,

                lineHeight:
                  1.25,

                whiteSpace:
                  "nowrap",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",
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
              sx={{
                mt:
                  0.3,

                fontSize:
                  12,

                color:
                  "#64748b",

                lineHeight:
                  1.3,

                textTransform:
                  "capitalize",

                whiteSpace:
                  "nowrap",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",
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
        </Box>


        {/* =====================================================
            Logout
            ===================================================== */}

        <Button
          type="button"
          onClick={
            handleLogout
          }
          sx={{
            height:
              38,

            px:
              2.2,

            flexShrink:
              0,

            borderRadius:
              "12px",

            border:
              "1px solid #fecaca",

            color:
              "#dc2626",

            bgcolor:
              "#ffffff",

            fontWeight:
              800,

            fontSize:
              13,

            textTransform:
              "none",

            transition:
              "background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease",

            "&:hover": {
              bgcolor:
                "#fef2f2",

              borderColor:
                "#fca5a5",

              transform:
                "translateY(-1px)",
            },

            "&:focus-visible":
              {
                outline:
                  "2px solid #dc2626",

                outlineOffset:
                  "2px",
              },
          }}
        >
          {
            t(
              "navigation.logout"
            )
          }
        </Button>

      </Box>
    </Box>
  );
}


export default Header;