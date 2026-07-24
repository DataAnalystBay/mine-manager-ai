import { Box, Typography, Stack, Chip } from "@mui/material";

function PageHeader({
  title,
  description,
  eyebrow,
  status,
  statusColor = "default",
  primaryAction,
  secondaryAction,
  children,
}) {
  return (
    <Box
      component="section"
      sx={{
        mb: 3,
        display: "flex",
        alignItems: {
          xs: "flex-start",
          md: "center",
        },
        justifyContent: "space-between",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        gap: 2.5,
      }}
    >
      {/* Page identity */}
      <Box
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        {eyebrow && (
          <Typography
            sx={{
              mb: 0.7,
              fontSize: 12,
              fontWeight: 800,
              color: "#64748b",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
        )}

        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: {
                xs: 26,
                md: 30,
              },
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </Typography>

          {status && (
            <Chip
              label={status}
              color={statusColor}
              size="small"
              sx={{
                height: 28,
                borderRadius: "999px",
                fontWeight: 800,
              }}
            />
          )}
        </Stack>

        {description && (
          <Typography
            sx={{
              mt: 1,
              maxWidth: 760,
              fontSize: 14,
              lineHeight: 1.6,
              color: "#64748b",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* Page actions */}
      {(primaryAction || secondaryAction || children) && (
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.25}
          sx={{
            width: {
              xs: "100%",
              md: "auto",
            },
            flexShrink: 0,

            "& .MuiButton-root": {
              minHeight: 42,
              borderRadius: "12px",
              px: 2.25,
              fontWeight: 800,
              textTransform: "none",
              boxShadow: "none",
            },
          }}
        >
          {children}
          {secondaryAction}
          {primaryAction}
        </Stack>
      )}
    </Box>
  );
}

export default PageHeader;