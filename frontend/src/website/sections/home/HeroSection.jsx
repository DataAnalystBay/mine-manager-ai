import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import DemoCta from "../../components/DemoCta";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";
import { websiteTokens } from "../../styles/websiteTokens";

const SCREENSHOT_PATH = "/website-v2/screenshots/dashboard/executive-dashboard-real.png";
const MINING_CONTEXT_PATH = "/website-v2/illustrations/hero/mine-manager-ai-hero-v2.png";

function HeroSection() {
  const { t } = useWebsiteCopy();
  return (
    <Box
      id="mine-manager-ai"
      component="section"
      aria-labelledby="website-hero-title"
      sx={{ position: "relative", overflow: "hidden", bgcolor: "background.paper", scrollMarginTop: "88px" }}
    >
      <Box
        component="img"
        src={MINING_CONTEXT_PATH}
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
          zIndex: 0,
          right: 0,
          bottom: { md: "-2%", lg: 0 },
          display: { xs: "none", md: "block" },
          width: { md: "70%", lg: "68%" },
          height: { md: "92%", lg: "100%" },
          objectFit: "contain",
          objectPosition: "right bottom",
          opacity: { md: 0.25, lg: 0.28 },
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <Container
        maxWidth={false}
        sx={{
          maxWidth: websiteTokens.layout.maxWidth,
          position: "relative",
          zIndex: 1,
          minHeight: { md: 488 },
          py: { xs: 6, sm: 8, md: 5.5 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(460px, 0.92fr) minmax(0, 1.25fr)" },
          alignItems: "center",
          gap: { xs: 5, sm: 6, md: 5.5 },
        }}
      >
        <Box sx={{ maxWidth: { xs: 680, md: 480 } }}>
          <Typography sx={{ mb: 2, color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em" }}>
            {t("pages.home.eyebrow")}
          </Typography>
          <Typography
            id="website-hero-title"
            component="h1"
            sx={{ whiteSpace: "pre-line", color: "text.primary", fontSize: { xs: 40, sm: 50, md: 49.5 }, fontWeight: 750, lineHeight: 1.08, letterSpacing: "-0.045em" }}
          >
            {t("pages.home.title")}
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 425, color: "text.secondary", fontSize: { xs: 17, md: 18 }, lineHeight: 1.65 }}>
            {t("pages.home.body")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5, alignItems: { sm: "center" } }}>
            <DemoCta fullWidth={false} />
            <Button component={Link} to="/product" variant="outlined">{t("pages.home.productCta")}</Button>
          </Stack>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: `${websiteTokens.radius.medium}px`,
            bgcolor: "#eef2f5",
            boxShadow: websiteTokens.shadows.card,
            transform: { md: "translate(-8px, -8px)", lg: "translate(-16px, -10px)" },
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              height: 28,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "#f8faf9",
            }}
          />
          <Box component="img" src={SCREENSHOT_PATH} alt={t("pages.home.screenshotAlt")} sx={{ display: "block", width: "100%", height: "auto", aspectRatio: "1896 / 980" }} />
        </Box>
      </Container>
    </Box>
  );
}

export default HeroSection;
