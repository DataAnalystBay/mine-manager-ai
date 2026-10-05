import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, Drawer, IconButton, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import DemoCta from "../components/DemoCta";
import LanguageMenu from "../components/LanguageMenu";
import { websiteNavigation } from "../config/navigation";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";

function MobileNavigation({ open, onClose }) {
  const { t } = useWebsiteCopy();
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: "min(88vw, 360px)", p: 3 } } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandLogo />
        <IconButton onClick={onClose} aria-label={t("navigation.closeMenu")}><CloseIcon /></IconButton>
      </Box>
      <Stack component="nav" spacing={1} sx={{ mt: 5 }}>
        {websiteNavigation.map((item) => <Button key={item.key} component={NavLink} to={item.to} onClick={onClose} sx={{ justifyContent: "flex-start" }}>{t(`navigation.${item.key}`)}</Button>)}
      </Stack>
      <Stack spacing={2} sx={{ mt: "auto", pt: 5 }}>
        <LanguageMenu />
        <Button component={NavLink} to="/login" variant="outlined" onClick={onClose}>{t("navigation.login")}</Button>
        <DemoCta fullWidth onClick={onClose} />
      </Stack>
    </Drawer>
  );
}
export default MobileNavigation;
