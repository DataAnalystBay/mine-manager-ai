import { Box, Typography } from "@mui/material";

function SectionHeading({ title, body }) {
  return <Box sx={{ maxWidth: 760 }}>
    <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 38, md: 56 }, lineHeight: 1.08, letterSpacing: "-0.035em" }}>{title}</Typography>
    {body && <Typography sx={{ mt: 2.5, fontSize: { xs: 17, md: 19 }, lineHeight: 1.7, color: "text.secondary" }}>{body}</Typography>}
  </Box>;
}
export default SectionHeading;
