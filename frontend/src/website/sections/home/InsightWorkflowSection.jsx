import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import { Box, Container, Typography } from "@mui/material";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";
import { websiteTokens } from "../../styles/websiteTokens";

const steps = [
  { key: "data", Icon: StorageOutlinedIcon },
  { key: "insight", Icon: PsychologyOutlinedIcon },
  { key: "priority", Icon: AssignmentOutlinedIcon },
  { key: "action", Icon: TaskAltOutlinedIcon },
];

function InsightWorkflowSection() {
  const { t } = useWebsiteCopy();
  return (
    <Box id="solution" component="section" aria-labelledby="workflow-title" sx={{ bgcolor: "#0b1815", color: "#ffffff", py: { xs: 10, md: 12 }, scrollMarginTop: "88px" }}>
      <Container maxWidth={false} sx={{ maxWidth: 1280 }}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography sx={{ color: "#76d5aa", fontSize: 12, fontWeight: 800, letterSpacing: "0.15em" }}>{t("workflow.eyebrow")}</Typography>
          <Typography id="workflow-title" component="h2" sx={{ mt: 2, color: "#ffffff", fontSize: { xs: 36, md: 48 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: "-0.035em" }}>{t("workflow.title")}</Typography>
          <Typography sx={{ mt: 2.5, whiteSpace: "pre-line", color: "#b8c7c1", fontSize: { xs: 16, md: 18 }, lineHeight: 1.7 }}>{t("workflow.body")}</Typography>
        </Box>
        <Box sx={{ mt: { xs: 6, md: 7 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "minmax(0, 1fr) 20px minmax(0, 1fr) 20px minmax(0, 1fr) 20px minmax(0, 1fr)" }, alignItems: "stretch", gap: { xs: 0, md: 2, lg: 1 } }}>
          {steps.flatMap(({ key, Icon }, index) => {
            const step = (
              <Box key={key} sx={{ minWidth: 0, minHeight: { xs: 225, lg: 350 }, px: { xs: 3, lg: 3.5 }, py: { xs: 3.5, lg: 4.5 }, border: "1px solid", borderColor: key === "action" ? "rgba(77, 210, 148, 0.72)" : "rgba(255,255,255,0.14)", borderRadius: `${websiteTokens.radius.medium}px`, bgcolor: key === "action" ? "rgba(22, 111, 77, 0.28)" : "rgba(255,255,255,0.035)", display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ color: key === "action" ? "#86e7bb" : "#91a69e", fontSize: 12, fontWeight: 850, letterSpacing: "0.1em" }}>0{index + 1}</Typography>
                  <Icon aria-hidden="true" sx={{ color: key === "action" ? "#76d5aa" : "#91a69e", fontSize: { xs: 27, lg: 30 } }} />
                </Box>
                <Typography component="h3" sx={{ mt: "auto", color: "#ffffff", fontSize: { xs: 23, lg: key === "priority" ? 22 : 26 }, fontWeight: 800, letterSpacing: "0.025em", lineHeight: 1.2 }}>{t(`workflow.steps.${key}.label`)}</Typography>
                <Typography sx={{ mt: 1.5, whiteSpace: "pre-line", color: "#b8c7c1", fontSize: 14, lineHeight: 1.6 }}>{t(`workflow.steps.${key}.detail`)}</Typography>
              </Box>
            );
            if (index === steps.length - 1) return [step];
            return [step, <Box key={`${key}-arrow`} aria-hidden="true" sx={{ display: { xs: "flex", md: "none", lg: "flex" }, minHeight: { xs: 48, lg: 0 }, alignItems: "center", justifyContent: "center", color: "#86e7bb", opacity: 0.9, transform: { xs: "rotate(90deg)", lg: "none" } }}><ArrowForwardIcon sx={{ fontSize: { xs: 22, lg: 26 } }} /></Box>];
          })}
        </Box>
      </Container>
    </Box>
  );
}

export default InsightWorkflowSection;
