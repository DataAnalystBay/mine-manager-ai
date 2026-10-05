import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import { Box, Container, Typography } from "@mui/material";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";
import { websiteTokens } from "../../styles/websiteTokens";

const sources = [
  { key: "excel", label: "Excel", image: "/website-v2/integrations/excel.jpeg" },
  { key: "powerBi", label: "Power BI", image: "/website-v2/integrations/power-bi.jpeg" },
  { key: "sap", label: "SAP", image: "/website-v2/integrations/sap.jpeg" },
  { key: "fleet", label: "Fleet Systems", Icon: LocalShippingOutlinedIcon },
  { key: "mining", label: "Mining Systems", Icon: PrecisionManufacturingOutlinedIcon },
  { key: "databaseApi", label: "Database / API", Icon: HubOutlinedIcon },
];

function AggregationConnector() {
  return (
    <Box aria-hidden="true" sx={{ position: "relative", width: "100%", height: { xs: 50, lg: 62 } }}>
      <Box sx={{ position: "absolute", top: 10, left: "8.333%", right: "8.333%", display: { xs: "none", lg: "block" }, height: "1px", bgcolor: "rgba(15, 92, 66, 0.24)" }} />
      <Box sx={{ position: "absolute", top: { xs: 0, lg: 10 }, bottom: 13, left: "50%", width: "1px", bgcolor: "rgba(15, 92, 66, 0.34)", transform: "translateX(-50%)" }} />
      <Box sx={{ position: "absolute", top: 6, left: "8.333%", right: "8.333%", display: { xs: "none", lg: "grid" }, gridTemplateColumns: "repeat(6, 1fr)" }}>
        {sources.map(({ key }) => <Box key={key} sx={{ width: 9, height: 9, mx: "auto", border: "2px solid", borderColor: "#f5f7f6", borderRadius: "50%", bgcolor: "rgba(15, 92, 66, 0.5)" }} />)}
      </Box>
      <ArrowDownwardRoundedIcon sx={{ position: "absolute", bottom: 0, left: "50%", color: "rgba(15, 92, 66, 0.58)", fontSize: 23, transform: "translateX(-50%)" }} />
    </Box>
  );
}

function IntegrationSection() {
  const { t } = useWebsiteCopy();

  return (
    <Box id="integration" component="section" aria-labelledby="integration-title" sx={{ bgcolor: "#f5f7f6", py: { xs: 8, md: 10 }, scrollMarginTop: "88px" }}>
      <Container maxWidth={false} sx={{ maxWidth: 1280 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(320px, 0.78fr)" }, alignItems: "end", gap: { xs: 2.5, md: 8 } }}>
          <Box>
            <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.15em" }}>{t("integration.eyebrow")}</Typography>
            <Typography id="integration-title" component="h2" sx={{ mt: 2, whiteSpace: "pre-line", color: "text.primary", fontSize: { xs: 35, md: 46 }, fontWeight: 750, lineHeight: 1.13, letterSpacing: "-0.04em" }}>
              {t("integration.title")}
            </Typography>
            <Typography sx={{ mt: 1.5, color: "primary.main", fontSize: { xs: 20, md: 24 }, fontWeight: 700, lineHeight: 1.35 }}>
              {t("integration.secondary")}
            </Typography>
          </Box>
          <Typography sx={{ maxWidth: 520, color: "text.secondary", fontSize: { xs: 16, md: 17 }, lineHeight: 1.7 }}>{t("integration.body")}</Typography>
        </Box>

        <Box aria-label={t("integration.flowLabel")} sx={{ mt: { xs: 6, md: 7 } }}>
          <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 650, letterSpacing: "0.025em" }}>{t("integration.sourcesTitle")}</Typography>
          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" }, gap: { xs: 1.5, md: 2 } }}>
            {sources.map(({ key, label, image, Icon }) => (
              <Box key={key} aria-label={t(`integration.sources.${key}`)} sx={{ minWidth: 0, minHeight: { xs: 112, md: 122 }, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.25, px: 1.5, py: 2, border: "1px solid", borderColor: "divider", borderRadius: `${websiteTokens.radius.medium}px`, bgcolor: "#ffffff" }}>
                {image ? (
                  <Box component="img" src={image} alt="" aria-hidden="true" loading="lazy" decoding="async" sx={{ display: "block", width: 48, height: 48, objectFit: "contain" }} />
                ) : (
                  <Icon aria-hidden="true" sx={{ width: 48, height: 48, p: 1, color: "primary.main" }} />
                )}
                <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 700, lineHeight: 1.25, textAlign: "center" }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          <AggregationConnector />

          <Box sx={{ maxWidth: 390, mx: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 3, py: 3, border: "1px solid", borderColor: "rgba(15, 92, 66, 0.3)", borderRadius: `${websiteTokens.radius.medium}px`, bgcolor: "rgba(15, 92, 66, 0.06)", textAlign: "center" }}>
            <Box component="img" src="/brand/mine-manager-ai-logo.png" alt="" aria-hidden="true" loading="lazy" decoding="async" sx={{ width: 50, height: 50, objectFit: "contain" }} />
            <Typography component="h3" sx={{ mt: 1.5, color: "primary.main", fontSize: 17, fontWeight: 800, letterSpacing: "0.035em" }}>MINE MANAGER AI</Typography>
            <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 13.5, lineHeight: 1.5 }}>{t("integration.platformDetail")}</Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default IntegrationSection;
