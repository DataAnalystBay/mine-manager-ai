import { Box, Link as MuiLink, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { homeSections } from "../config/homeSections";
import { useWebsiteCopy } from "../i18n/useWebsiteCopy";

const HEADER_OFFSET = 88;

function StoryProgressRail() {
  const { language } = useWebsiteCopy();
  const [activeId, setActiveId] = useState(homeSections[0].id);
  const intersectingIds = useRef(new Set());

  useEffect(() => {
    const visibleIds = intersectingIds.current;
    const sections = homeSections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleIds.add(entry.target.id);
          else visibleIds.delete(entry.target.id);
        });

        for (let index = homeSections.length - 1; index >= 0; index -= 1) {
          const { id } = homeSections[index];
          if (visibleIds.has(id)) {
            setActiveId(id);
            break;
          }
        }
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -65% 0px`, threshold: [0, 0.1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      visibleIds.clear();
    };
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
        left: "max(8px, calc((100vw - 1280px) / 2 - 154px))",
        display: "none",
        width: 146,
        transform: "translateY(-50%)",
        "@media (min-width: 1600px)": { display: "block" },
      }}
    >
      <Box aria-hidden="true" sx={{ position: "absolute", top: 7, bottom: 7, left: 4, width: "1px", bgcolor: "#e1e7e3" }} />
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
              gridTemplateColumns: "10px minmax(0, 1fr)",
              alignItems: "center",
              gap: 1,
              minHeight: 36,
              color: active ? "primary.main" : "#8b9691",
              borderRadius: 1,
              "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                zIndex: 1,
                width: active ? 9 : 8,
                height: active ? 9 : 8,
                border: "1px solid",
                borderColor: active ? "primary.main" : "#c4cdc8",
                borderRadius: "50%",
                bgcolor: active ? "primary.main" : "background.paper",
              }}
            />
            <Typography component="span" sx={{ whiteSpace: "nowrap", fontSize: active ? 12.5 : 11.5, fontWeight: active ? 600 : 400, lineHeight: 1.25 }}>
              {label}
            </Typography>
          </MuiLink>
        );
      })}
    </Box>
  );
}

export default StoryProgressRail;
