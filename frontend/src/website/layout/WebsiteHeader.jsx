import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Button, IconButton, Toolbar } from "@mui/material";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import BrandLogo from "../components/BrandLogo";
import DemoCta from "../components/DemoCta";
import LanguageMenu from "../components/LanguageMenu";
import { websiteNavigation } from "../config/navigation";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";
import { websiteTokens } from "../styles/websiteTokens";
import MobileNavigation from "./MobileNavigation";

function WebsiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useWebsiteCopy();
  return <>
    <AppBar component="header" position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "#ffffff", borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar disableGutters sx={{ width: "100%", maxWidth: websiteTokens.layout.maxWidth, height: `${websiteTokens.layout.headerHeight}px`, minHeight: `${websiteTokens.layout.headerHeight}px !important`, mx: "auto", px: { xs: 2, md: 3 } }}>
        <Box sx={{ flex: 1, display: "flex" }}><BrandLogo /></Box>
        <Box component="nav" sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
          {websiteNavigation.map((item) => <Button key={item.key} component={NavLink} to={item.to} end={item.to === "/"} color="inherit" sx={{ position: "relative", borderRadius: 1, "&.active": { color: "primary.main", bgcolor: "transparent" }, "&.active::after": { content: '""', position: "absolute", right: 16, bottom: 4, left: 16, height: 2, borderRadius: 1, bgcolor: "primary.main" }, "&:focus-visible": { outline: "3px solid rgba(31,138,98,0.28)", outlineOffset: 2 } }}>{t(`navigation.${item.key}`)}</Button>)}
        </Box>
        <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
          <LanguageMenu />
          <Button component={NavLink} to="/login" variant="outlined">{t("navigation.login")}</Button>
          <DemoCta />
        </Box>
        <Box sx={{ ml: "auto", display: { xs: "flex", md: "none" }, alignItems: "center", gap: 0.5 }}>
          <DemoCta />
          <IconButton onClick={() => setMobileOpen(true)} aria-label={t("navigation.menu")}><MenuIcon /></IconButton>
        </Box>
      </Toolbar>
    </AppBar>
    <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
  </>;
}
export default WebsiteHeader;
