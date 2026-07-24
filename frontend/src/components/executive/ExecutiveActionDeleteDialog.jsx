import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

function getActionTitle(action) {
  return (
    action?.action_title ||
    action?.title ||
    action?.recommended_action ||
    action?.action ||
    "Untitled executive action"
  );
}

function ExecutiveActionDeleteDialog({
  open,
  action,
  onClose,
  onConfirm,
  deleting = false,
}) {
  const actionTitle = getActionTitle(action);

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              bgcolor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DeleteIcon />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 21,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Delete Executive Action
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                fontSize: 13.5,
                color: "#64748b",
              }}
            >
              This action will be permanently removed.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          py: 3,
        }}
      >
        <Alert
          severity="warning"
          sx={{
            borderRadius: "12px",
            mb: 2.5,
          }}
        >
          This operation cannot be undone.
        </Alert>

        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.65,
            color: "#475569",
          }}
        >
          Are you sure you want to delete this executive action?
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: "12px",
            bgcolor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.5,
            }}
          >
            {actionTitle}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: "1px solid #e2e8f0",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={deleting}
          sx={{
            borderRadius: "10px",
            color: "#475569",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={deleting || !action}
          startIcon={
            deleting ? (
              <CircularProgress
                size={17}
                sx={{
                  color: "#ffffff",
                }}
              />
            ) : (
              <DeleteIcon />
            )
          }
          sx={{
            minWidth: 145,
            borderRadius: "10px",
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "none",

            "&:hover": {
              boxShadow: "none",
            },
          }}
        >
          {deleting ? "Deleting..." : "Delete Action"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExecutiveActionDeleteDialog;