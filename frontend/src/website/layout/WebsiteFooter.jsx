import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";
import { websiteTokens } from "../styles/websiteTokens";

function WebsiteFooter() {
  const { t } = useWebsiteCopy();
  return <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
    <Container maxWidth={false} sx={{ maxWidth: websiteTokens.layout.maxWidth, py: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
        <Typography color="text.secondary" variant="body2">© {new Date().getFullYear()} {t("footer.copyright")}</Typography>
        <Link href="tel:+97699105308" color="text.secondary" underline="hover" sx={{ fontSize: 14, fontWeight: 650 }}>+976 9910 5308</Link>
      </Stack>
    </Container>
  </Box>;
}
export default WebsiteFooter;
