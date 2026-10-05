import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";

function FinalDemoCtaSection() {
  const { t } = useWebsiteCopy();

  return (
    <Box
      id="demo"
      component="section"
      aria-labelledby="final-demo-title"
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        minHeight: { md: 500 },
        display: "flex",
        alignItems: "center",
        bgcolor: "#0b211b",
        backgroundImage: "linear-gradient(rgba(6, 28, 21, 0.78), rgba(5, 23, 18, 0.84)), url('/website-v2/illustrations/cta/final-demo-mine.png')",
        backgroundPosition: { xs: "56% 70%", md: "center 68%" },
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        py: { xs: 8, md: 8 },
        scrollMarginTop: "88px",
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1280 }}>
        <Box sx={{ maxWidth: 1100, mx: "auto", textAlign: "center" }}>
          <Typography sx={{ color: "#78c6a5", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em" }}>{t("finalDemo.eyebrow")}</Typography>
          <Typography
            id="final-demo-title"
            component="h2"
            sx={{ mt: 2, whiteSpace: "pre-line", color: "#f7faf8", fontSize: { xs: 35, sm: 42, md: 50 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: "-0.04em" }}
          >
            {t("finalDemo.title")}
          </Typography>
          <Typography sx={{ maxWidth: 700, mx: "auto", mt: 3, color: "rgba(239, 246, 242, 0.72)", fontSize: { xs: 16, md: 18 }, lineHeight: 1.7 }}>
            {t("finalDemo.body")}
          </Typography>
          <Button
            component={Link}
            to="/contact?intent=demo"
            variant="contained"
            sx={{ mt: 4, minWidth: { xs: "100%", sm: 180 }, bgcolor: "#1f8a62", color: "#ffffff", "&:hover": { bgcolor: "#187551" } }}
          >
            {t("finalDemo.cta")}
          </Button>
          <Typography sx={{ mt: 2, color: "rgba(239, 246, 242, 0.56)", fontSize: 13.5, lineHeight: 1.55 }}>{t("finalDemo.reassurance")}</Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default FinalDemoCtaSection;
