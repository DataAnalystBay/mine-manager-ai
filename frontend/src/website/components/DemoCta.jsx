import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";

function DemoCta({ fullWidth = false, onClick }) {
  const { t } = useWebsiteCopy();
  return <Button component={Link} to="/contact?intent=demo" variant="contained" fullWidth={fullWidth} onClick={onClick}>{t("navigation.demo")}</Button>;
}
export default DemoCta;
