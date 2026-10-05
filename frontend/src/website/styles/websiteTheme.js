import { createTheme } from "@mui/material/styles";
import { websiteTokens } from "./websiteTokens";

export const websiteTheme = createTheme({
  palette: {
    primary: { main: websiteTokens.colors.primary, dark: websiteTokens.colors.primaryHover, contrastText: websiteTokens.colors.white },
    secondary: { main: websiteTokens.colors.navy },
    background: { default: websiteTokens.colors.background, paper: websiteTokens.colors.surface },
    text: { primary: websiteTokens.colors.text, secondary: websiteTokens.colors.mutedText },
    divider: websiteTokens.colors.border,
  },
  typography: { fontFamily: websiteTokens.typography.fontFamily, h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, button: { fontWeight: 700, textTransform: "none" } },
  shape: { borderRadius: websiteTokens.radius.medium },
  components: { MuiButton: { styleOverrides: { root: { minHeight: websiteTokens.buttons.height, paddingInline: websiteTokens.buttons.horizontalPadding, borderRadius: websiteTokens.radius.small, boxShadow: "none" } } } },
});
