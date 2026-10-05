import { Box, Container, Typography } from "@mui/material";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";
import { websiteTokens } from "../../styles/websiteTokens";

const roles = [
  { key: "generalManager", image: "/website-v2/illustrations/roles/executive-leadership.png" },
  { key: "operationsManager", image: "/website-v2/illustrations/roles/operations-manager.png" },
  { key: "technicalServices", image: "/website-v2/illustrations/roles/technical-services-manager.png" },
  { key: "superintendent", image: "/website-v2/illustrations/roles/superintendent.png" },
  { key: "dataAnalyst", image: "/website-v2/illustrations/roles/reporting-data-analyst.png" },
];

function LeadershipLevelsSection() {
  const { t } = useWebsiteCopy();

  return (
    <Box id="leadership" component="section" aria-labelledby="leadership-title" sx={{ bgcolor: "background.paper", py: { xs: 9, md: 14 }, scrollMarginTop: "88px" }}>
      <Container maxWidth={false} sx={{ maxWidth: 1280 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.25fr) minmax(280px, 0.75fr)" }, alignItems: "end", gap: { xs: 2.5, md: 8 } }}>
          <Box>
            <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.15em" }}>{t("leadership.eyebrow")}</Typography>
            <Typography id="leadership-title" component="h2" sx={{ mt: 2, color: "text.primary", fontSize: { xs: 36, md: 49 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: "-0.04em" }}>{t("leadership.title")}</Typography>
          </Box>
          <Typography sx={{ color: "text.secondary", fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}>{t("leadership.body")}</Typography>
        </Box>

        <Box sx={{ mt: { xs: 6, md: 8 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: 2 }}>
          {roles.map(({ key, image }) => (
            <Box key={key} sx={{ minWidth: 0, minHeight: { xs: 390, lg: 430 }, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid", borderColor: "divider", borderRadius: `${websiteTokens.radius.medium}px`, bgcolor: "#ffffff" }}>
              <Box sx={{ height: 170, flexShrink: 0, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#f3f6f4" }}>
                <Box component="img" src={image} alt={t(`leadership.roles.${key}.imageAlt`)} loading="lazy" decoding="async" sx={{ display: "block", width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center" }} />
              </Box>
              <Box sx={{ display: "flex", flex: 1, flexDirection: "column", px: { xs: 2.5, lg: 2.25 }, py: 3 }}>
                <Typography component="h3" sx={{ color: "text.primary", fontSize: { xs: 17, lg: 16 }, fontWeight: 800, lineHeight: 1.3, letterSpacing: "0.025em" }}>{t(`leadership.roles.${key}.title`)}</Typography>
                <Typography sx={{ mt: 2, color: "primary.main", fontSize: 14, fontWeight: 600, lineHeight: 1.55 }}>{t(`leadership.roles.${key}.focus`)}</Typography>
                <Typography sx={{ mt: "auto", pt: 3, color: "text.secondary", fontSize: 14, lineHeight: 1.6 }}>{t(`leadership.roles.${key}.question`)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default LeadershipLevelsSection;
