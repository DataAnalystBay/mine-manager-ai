import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function BrandLogo() {
  return (
    <Box component={Link} to="/" aria-label="Mine Manager AI" sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, color: "inherit", textDecoration: "none" }}>
      <Box component="img" src="/brand/mine-manager-ai-logo.png" alt="" sx={{ width: 46, height: 40, objectFit: "contain" }} />
      <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Mine Manager AI</Typography>
    </Box>
  );
}
export default BrandLogo;
