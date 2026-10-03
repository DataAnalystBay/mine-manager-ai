import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Container, Typography } from "@mui/material";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";

const challenges = [
  { key: "fragmented", Icon: StorageOutlinedIcon },
  { key: "delayed", Icon: WarningAmberOutlinedIcon },
  { key: "reporting", Icon: DescriptionOutlinedIcon },
  { key: "priority", Icon: TrackChangesOutlinedIcon },
];

function ChallengeSection() {
  const { t } = useWebsiteCopy();
  return (
    <Box id="challenge" component="section" aria-labelledby="challenge-title" sx={{ bgcolor: "background.paper", py: { xs: 10, md: 15 }, scrollMarginTop: "88px" }}>
      <Container maxWidth={false} sx={{ maxWidth: 1280 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.35fr) minmax(280px, 0.65fr)" }, alignItems: "end", gap: { xs: 3, md: 8 } }}>
          <Box>
            <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.15em" }}>{t("challenge.eyebrow")}</Typography>
            <Typography id="challenge-title" component="h2" sx={{ mt: 2, whiteSpace: "pre-line", color: "text.primary", fontSize: { xs: 34, md: 49 }, fontWeight: 750, lineHeight: 1.14, letterSpacing: "-0.035em" }}>{t("challenge.title")}</Typography>
          </Box>
          <Typography sx={{ whiteSpace: "pre-line", color: "text.secondary", fontSize: { xs: 16, md: 17 }, lineHeight: 1.7 }}>{t("challenge.body")}</Typography>
        </Box>
        <Box sx={{ mt: { xs: 6, md: 9 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, borderBlock: "1px solid", borderColor: "divider" }}>
          {challenges.map(({ key, Icon }, index) => (
            <Box key={key} sx={{ minHeight: { sm: 250, lg: 285 }, px: { xs: 0, sm: 3, lg: 3.5 }, py: { xs: 4, md: 5 }, borderLeft: { sm: index % 2 === 1 ? "1px solid" : "none", lg: index === 0 ? "none" : "1px solid" }, borderTop: { xs: index === 0 ? "none" : "1px solid", sm: index < 2 ? "none" : "1px solid", lg: "none" }, borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography aria-hidden="true" sx={{ color: "primary.main", fontSize: 13, fontWeight: 850, letterSpacing: "0.08em" }}>0{index + 1}</Typography>
                <Icon aria-hidden="true" sx={{ color: "primary.main", fontSize: 24 }} />
              </Box>
              <Typography component="h3" sx={{ mt: 5, color: "text.primary", fontSize: { xs: 20, lg: 23 }, fontWeight: 750, lineHeight: 1.25 }}>{t(`challenge.items.${key}.title`)}</Typography>
              <Typography sx={{ mt: 2, color: "text.secondary", fontSize: 15, lineHeight: 1.7 }}>{t(`challenge.items.${key}.body`)}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default ChallengeSection;
