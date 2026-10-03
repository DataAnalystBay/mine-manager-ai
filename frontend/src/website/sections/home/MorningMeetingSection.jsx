import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";
import { websiteTokens } from "../../styles/websiteTokens";

const SCREENSHOT_PATH = "/website-v2/screenshots/meeting/morning-management-meeting-real.png";
const ROOM_PATH = "/website-v2/screenshots/meeting/meeting-room-reference-v2.png";

const cues = [
  { key: "time", Icon: AccessTimeOutlinedIcon },
  { key: "screen", Icon: DashboardOutlinedIcon },
  { key: "owner", Icon: AssignmentIndOutlinedIcon },
  { key: "decision", Icon: BoltOutlinedIcon },
];

function MorningMeetingSection() {
  const { t } = useWebsiteCopy();

  return (
    <Box
      id="use-case"
      component="section"
      aria-labelledby="morning-meeting-title"
      sx={{ bgcolor: "#f5f7f6", py: { xs: 8, md: 10 }, scrollMarginTop: "88px" }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1280,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(360px, 0.52fr) minmax(0, 1fr)" },
          gridTemplateAreas: { xs: '"copy" "visual" "cues"', lg: '"copy visual" "cues visual"' },
          alignItems: "center",
          columnGap: { xs: 5, md: 6, lg: 6 },
          rowGap: { xs: 5, md: 5, lg: 3 },
        }}
      >
        <Box sx={{ gridArea: "copy", maxWidth: { xs: 680, md: 420 } }}>
          <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.15em" }}>
            {t("morningMeeting.eyebrow")}
          </Typography>
          <Typography
            id="morning-meeting-title"
            component="h2"
            sx={{ mt: 2, whiteSpace: "pre-line", color: "text.primary", fontSize: { xs: 36, md: 44, lg: 48 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: "-0.04em" }}
          >
            {t("morningMeeting.title")}
          </Typography>
          <Typography sx={{ mt: 3, whiteSpace: "pre-line", color: "text.secondary", fontSize: { xs: 16, md: 17 }, lineHeight: 1.7 }}>
            {t("morningMeeting.body")}
          </Typography>
          <Button component={Link} to="/contact?intent=demo" variant="contained" sx={{ mt: 4 }}>
            {t("morningMeeting.cta")}
          </Button>
        </Box>

        <Box sx={{ gridArea: "visual", minWidth: 0 }}>
          <Box component="img" src={ROOM_PATH} alt={t("morningMeeting.visualAlt")} sx={{ display: { xs: "none", md: "block" }, width: "100%", height: "auto", objectFit: "contain", borderRadius: `${websiteTokens.radius.large}px` }} />
          <Box component="img" src={SCREENSHOT_PATH} alt={t("morningMeeting.screenshotAlt")} sx={{ display: { xs: "block", md: "none" }, width: "100%", height: "auto", border: "1px solid", borderColor: "divider", borderRadius: `${websiteTokens.radius.medium}px`, boxShadow: websiteTokens.shadows.card }} />
        </Box>

        <Box sx={{ gridArea: "cues", alignSelf: "start", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
          {cues.map(({ key, Icon }) => (
            <Box key={key} sx={{ minWidth: 0, display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", gap: 1.25, px: 1.5, py: 1.5, border: "1px solid", borderColor: "rgba(15, 92, 66, 0.12)", borderRadius: `${websiteTokens.radius.small}px`, bgcolor: "rgba(255,255,255,0.58)" }}>
              <Icon aria-hidden="true" sx={{ mt: 0.25, color: "primary.main", fontSize: 20 }} />
              <Box>
                <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 750, lineHeight: 1.3 }}>{t(`morningMeeting.cues.${key}.title`)}</Typography>
                <Typography sx={{ mt: 0.4, color: "text.secondary", fontSize: 12.5, lineHeight: 1.45 }}>{t(`morningMeeting.cues.${key}.detail`)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export default MorningMeetingSection;
