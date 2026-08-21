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

import { useLanguage } from "../../context/LanguageContext";

import {
  translateDynamicExecutiveActionTitle,
} from "../../i18n/dynamicTranslations";


function localizeLabel(
  t,
  englishText,
  mongolianText
) {
  return t("common.language") === "Хэл"
    ? mongolianText
    : englishText;
}


function getActionTitle(
  action,
  t
) {
  const rawTitle =
    action?.action_title ||
    action?.title ||
    action?.recommended_action ||
    action?.action ||
    localizeLabel(
      t,
      "Untitled executive action",
      "Нэргүй удирдлагын арга хэмжээ"
    );

  return translateDynamicExecutiveActionTitle(
    rawTitle,
    t
  );
}


function ExecutiveActionDeleteDialog({
  open,
  action,
  onClose,
  onConfirm,
  deleting = false,
}) {
  const { t } = useLanguage();

  const actionTitle =
    getActionTitle(
      action,
      t
    );

  const handleClose = (
    event,
    reason
  ) => {
    if (deleting) {
      return;
    }

    if (
      reason === "backdropClick" ||
      reason === "escapeKeyDown"
    ) {
      onClose?.();
      return;
    }

    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow:
              "0 24px 60px rgba(15, 23, 42, 0.22)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
          borderBottom:
            "1px solid #e2e8f0",
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
              {localizeLabel(
                t,
                "Delete Executive Action",
                "Удирдлагын арга хэмжээг устгах"
              )}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                fontSize: 13.5,
                color: "#64748b",
              }}
            >
              {localizeLabel(
                t,
                "This action will be permanently removed.",
                "Энэ арга хэмжээг бүрмөсөн устгана."
              )}
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
          {localizeLabel(
            t,
            "This operation cannot be undone.",
            "Энэ үйлдлийг буцаах боломжгүй."
          )}
        </Alert>

        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.65,
            color: "#475569",
          }}
        >
          {localizeLabel(
            t,
            "Are you sure you want to delete this executive action?",
            "Та энэ удирдлагын арга хэмжээг устгахдаа итгэлтэй байна уу?"
          )}
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: "12px",
            bgcolor: "#f8fafc",
            border:
              "1px solid #e2e8f0",
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
          borderTop:
            "1px solid #e2e8f0",
          gap: 1,
        }}
      >
        <Button
          type="button"
          onClick={onClose}
          disabled={deleting}
          sx={{
            borderRadius: "10px",
            color: "#475569",
            fontWeight: 800,
            textTransform: "none",
          }}
        >
          {localizeLabel(
            t,
            "Cancel",
            "Цуцлах"
          )}
        </Button>

        <Button
          type="button"
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={
            deleting ||
            !action
          }
          startIcon={
            deleting ? (
              <CircularProgress
                size={17}
                color="inherit"
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
          {deleting
            ? localizeLabel(
                t,
                "Deleting...",
                "Устгаж байна..."
              )
            : localizeLabel(
                t,
                "Delete Action",
                "Арга хэмжээг устгах"
              )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


export default ExecutiveActionDeleteDialog;
