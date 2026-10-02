import { Box, Container, Typography } from "@mui/material";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";
import { websiteTokens } from "../styles/websiteTokens";

function WebsiteFooter() {
  const { t } = useWebsiteCopy();
  return <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
    <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, py: 4 }}><Typography color="text.secondary" variant="body2">© {new Date().getFullYear()} {t("footer.copyright")}</Typography></Container>
  </Box>;
}
export default WebsiteFooter;
