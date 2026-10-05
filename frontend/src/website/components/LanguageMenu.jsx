import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Button, Menu, MenuItem } from "@mui/material";
import { useState } from "react";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";

function LanguageMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { language, setLanguage, t } = useWebsiteCopy();
  const select = (value) => { setLanguage(value); setAnchorEl(null); };
  return <>
    <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} aria-label={t("navigation.language")} aria-haspopup="menu" aria-expanded={Boolean(anchorEl)} onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ minWidth: 74 }}>{language}</Button>
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
      <MenuItem selected={language === "MN"} onClick={() => select("MN")}>MN</MenuItem>
      <MenuItem selected={language === "EN"} onClick={() => select("EN")}>EN</MenuItem>
    </Menu>
  </>;
}
export default LanguageMenu;
