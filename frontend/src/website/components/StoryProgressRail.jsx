import { Box, Link as MuiLink, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { homeSections } from "../config/homeSections";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";

const HEADER_OFFSET = 88;

function StoryProgressRail() {
  const { language } = useWebsiteCopy();
  const [activeId, setActiveId] = useState(homeSections[0].id);

  useEffect(() => {
    const sections = homeSections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top - HEADER_OFFSET) - Math.abs(b.boundingClientRect.top - HEADER_OFFSET));

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`, threshold: [0, 0.15, 0.35] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const navigateTo = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <Box
      component="nav"
      aria-label="Homepage sections"
      sx={{
        position: "fixed",
        zIndex: 20,
        top: "46%",
        left: "max(12px, calc((100vw - 1280px) / 2 - 128px))",
        display: "none",
        width: 116,
        transform: "translateY(-50%)",
        "@media (min-width: 1560px)": { display: "block" },
      }}
    >
      <Box aria-hidden="true" sx={{ position: "absolute", top: 7, bottom: 7, left: 5, width: "1px", bgcolor: "#d4ddd8" }} />
      {homeSections.map(({ id, labels }) => {
        const active = activeId === id;
        const label = labels[language] ?? labels.MN;

        return (
          <MuiLink
            key={id}
            href={`#${id}`}
            aria-label={language === "MN" ? `${label} хэсэг рүү очих` : `Navigate to ${label} section`}
            aria-current={active ? "true" : undefined}
            onClick={(event) => navigateTo(event, id)}
            underline="none"
            sx={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "12px minmax(0, 1fr)",
              alignItems: "center",
              gap: 1,
              minHeight: 36,
              color: active ? "primary.main" : "#7a8781",
              borderRadius: 1,
              "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                zIndex: 1,
                width: active ? 11 : 9,
                height: active ? 11 : 9,
                ml: active ? 0 : "1px",
                border: "1.5px solid",
                borderColor: active ? "primary.main" : "#aeb9b3",
                borderRadius: "50%",
                bgcolor: active ? "primary.main" : "background.paper",
              }}
            />
            <Typography component="span" sx={{ fontSize: 12, fontWeight: active ? 650 : 400, lineHeight: 1.25 }}>
              {label}
            </Typography>
          </MuiLink>
        );
      })}
    </Box>
  );
}

export default StoryProgressRail;
