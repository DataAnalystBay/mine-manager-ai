import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Typography } from "@mui/material";
import { useState } from "react";
import { useWebsiteCopy } from "../../i18n/useWebsiteCopy";

const faqItems = ["systems", "problems", "configuration", "data", "demoPilot", "chatbot"];

function FaqSection() {
  const { t } = useWebsiteCopy();
  const [expanded, setExpanded] = useState(faqItems[0]);

  return (
    <Box id="faq" component="section" aria-labelledby="faq-title" sx={{ bgcolor: "background.paper", py: 8, scrollMarginTop: "88px" }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1280,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.68fr) minmax(0, 1fr)" },
          alignItems: "start",
          gap: { xs: 4.5, md: 5, lg: 6 },
        }}
      >
        <Box sx={{ maxWidth: { xs: 560, lg: "none" } }}>
          <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 800, letterSpacing: "0.15em" }}>
            {t("faq.eyebrow")}
          </Typography>
          <Typography
            id="faq-title"
            component="h2"
            sx={{ mt: 2, whiteSpace: { xs: "pre-line", lg: "pre" }, color: "text.primary", fontSize: { xs: 35, md: 42 }, fontWeight: 750, lineHeight: 1.13, letterSpacing: "-0.04em" }}
          >
            {t("faq.title")}
          </Typography>
          <Typography sx={{ mt: 3, color: "text.secondary", fontSize: { xs: 16, md: 17 }, lineHeight: 1.7 }}>
            {t("faq.body")}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0, borderBlock: "1px solid", borderColor: "divider" }}>
          {faqItems.map((key) => {
            const isExpanded = expanded === key;
            const summaryId = `faq-${key}-question`;
            const detailsId = `faq-${key}-answer`;

            return (
              <Accordion
                key={key}
                expanded={isExpanded}
                onChange={(_, nextExpanded) => setExpanded(nextExpanded ? key : false)}
                disableGutters
                elevation={0}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  borderRadius: "0 !important",
                  bgcolor: "transparent",
                  "&::before": { display: "none" },
                  "&:last-of-type": { borderBottom: 0 },
                  "&.Mui-expanded": { my: 0 },
                }}
              >
                <AccordionSummary
                  id={summaryId}
                  aria-controls={detailsId}
                  expandIcon={isExpanded ? <RemoveRoundedIcon /> : <AddRoundedIcon />}
                  sx={{
                    minHeight: 68,
                    px: { xs: 1, sm: 1.5 },
                    "&.Mui-expanded": { minHeight: 68 },
                    "& .MuiAccordionSummary-content": { my: 1.75 },
                    "& .MuiAccordionSummary-content.Mui-expanded": { my: 1.75 },
                    "& .MuiAccordionSummary-expandIconWrapper": { color: "primary.main", fontSize: 20 },
                    "& .MuiSvgIcon-root": { fontSize: 20 },
                    "&:focus-visible": { outline: "3px solid rgba(31,138,98,0.28)", outlineOffset: -3 },
                  }}
                >
                  <Typography sx={{ pr: 2, color: "text.primary", fontSize: { xs: 15.5, sm: 16.5 }, fontWeight: 650, lineHeight: 1.45 }}>
                    {t(`faq.items.${key}.question`)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails id={detailsId} aria-labelledby={summaryId} sx={{ px: { xs: 1, sm: 1.5 }, pt: 0, pb: 2.5 }}>
                  <Typography sx={{ maxWidth: 680, color: "text.secondary", fontSize: { xs: 15, md: 15.5 }, lineHeight: 1.65 }}>
                    {t(`faq.items.${key}.answer`)}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}

export default FaqSection;
