import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function BrandLogo() {
  return (
    <Box
      component={Link}
      to="/"
      aria-label="Mine Manager AI"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.25 },
        color: "inherit",
        textDecoration: "none",
        "&:focus-visible": {
          outline: "3px solid rgba(31,138,98,0.28)",
          outlineOffset: 3,
          borderRadius: 1,
        },
      }}
    >
      <Box
        component="img"
        src="/brand/mine-manager-ai-logo.png"
        alt=""
        sx={{
          display: "block",
          width: { xs: 32, sm: 38 },
          height: { xs: 32, sm: 38 },
          flexShrink: 0,
          objectFit: "contain",
        }}
      />
      <Typography
        component="span"
        sx={{
          color: "secondary.main",
          fontSize: { xs: 14, sm: 17 },
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        MINE MANAGER AI
      </Typography>
    </Box>
  );
}
export default BrandLogo;
