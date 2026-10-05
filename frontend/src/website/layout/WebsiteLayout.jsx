import { Box, ScopedCssBaseline, ThemeProvider } from "@mui/material";
import { Outlet } from "react-router-dom";
import { WebsiteLanguageProvider } from "../i18n/useWebsiteCopy";
import { websiteTheme } from "../styles/websiteTheme";
import WebsiteFooter from "./WebsiteFooter";
import WebsiteHeader from "./WebsiteHeader";

function WebsiteLayout() {
  return <WebsiteLanguageProvider><ThemeProvider theme={websiteTheme}>
    <ScopedCssBaseline sx={{ minHeight: "100vh" }}>
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <WebsiteHeader />
      <Box component="main"><Outlet /></Box>
      <WebsiteFooter />
    </Box>
    </ScopedCssBaseline>
  </ThemeProvider></WebsiteLanguageProvider>;
}
export default WebsiteLayout;
