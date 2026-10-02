import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import { Box, Container, Typography } from "@mui/material";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";
import { websiteTokens } from "../../styles/websiteTokens";

const items = [
  { key: "systems", Icon: SyncAltOutlinedIcon },
  { key: "language", Icon: LanguageOutlinedIcon },
  { key: "access", Icon: AdminPanelSettingsOutlinedIcon },
  { key: "audit", Icon: HistoryOutlinedIcon },
];

function TrustRail() {
  const { t } = useWebsiteCopy();
  return (
    <Box component="section" aria-label="Enterprise trust" sx={{ borderBlock: "1px solid", borderColor: "divider", bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, py: { xs: 2.5, lg: 0 } }}>
        {items.map(({ key, Icon }, index) => (
          <Box key={key} sx={{ minHeight: { xs: 72, lg: 86 }, px: { xs: 0, sm: 2.5 }, py: { xs: 1.5, lg: 0 }, display: "flex", alignItems: "center", gap: 1.5, borderLeft: { lg: index === 0 ? "none" : "1px solid" }, borderTop: { xs: index === 0 ? "none" : "1px solid", sm: index < 2 ? "none" : "1px solid", lg: "none" }, borderColor: "divider" }}>
            <Icon aria-hidden="true" sx={{ flexShrink: 0, color: "primary.main", fontSize: 23 }} />
            <Box>
              <Typography sx={{ color: "text.primary", fontSize: 13.5, fontWeight: 750, lineHeight: 1.35 }}>{t(`trust.${key}.title`)}</Typography>
              <Typography sx={{ mt: 0.35, color: "text.secondary", fontSize: 11.5, lineHeight: 1.4 }}>{t(`trust.${key}.detail`)}</Typography>
            </Box>
          </Box>
        ))}
      </Container>
    </Box>
  );
}

export default TrustRail;
