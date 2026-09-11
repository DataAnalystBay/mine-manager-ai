import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockResetIcon from "@mui/icons-material/LockReset";

import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from "../api/userApi";
import { useLanguage } from "../context/LanguageContext";
import { formatDisplayDate } from "../utils/displayDateTime";


const ROLE_OPTIONS = [
  "Administrator",
  "General Manager",
  "Mine Manager",
  "Superintendent",
  "Viewer",
];


const INITIAL_CREATE_FORM = {
  full_name: "",
  email: "",
  password: "",
  role: "Viewer",
};


const INITIAL_EDIT_FORM = {
  id: null,
  full_name: "",
  email: "",
  role: "Viewer",
};


const INITIAL_PASSWORD_FORM = {
  new_password: "",
  confirm_password: "",
};


function getRoleChipColor(role) {
  switch (role) {
    case "Administrator":
      return "error";

    case "General Manager":
      return "secondary";

    case "Mine Manager":
      return "primary";

    case "Superintendent":
      return "warning";

    default:
      return "default";
  }
}


function getRoleLabel(role, t) {
  const key = {
    Administrator: "administrator",
    "General Manager": "generalManager",
    "Mine Manager": "mineManager",
    Superintendent: "superintendent",
    Viewer: "viewer",
  }[role];

  return key ? t(`userManagement.${key}`) : role;
}


function validateUserFields({
  full_name,
  email,
  role,
}, t) {
  const validationErrors = {};

  const normalizedName =
    full_name?.trim() || "";

  const normalizedEmail =
    email?.trim() || "";

  if (!normalizedName) {
    validationErrors.full_name =
      t("userManagement.fullNameRequired");
  } else if (normalizedName.length < 2) {
    validationErrors.full_name =
      t("userManagement.fullNameMinimum");
  }

  if (!normalizedEmail) {
    validationErrors.email =
      t("userManagement.emailRequired");
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    )
  ) {
    validationErrors.email =
      t("userManagement.emailInvalid");
  }

  if (!role) {
    validationErrors.role =
      t("userManagement.roleRequired");
  }

  return validationErrors;
}


function validateCreateForm(form, t) {
  const validationErrors =
    validateUserFields(form, t);

  if (!form.password) {
    validationErrors.password =
      t("userManagement.passwordRequired");
  } else if (form.password.length < 8) {
    validationErrors.password =
      t("userManagement.passwordMinimum");
  }

  return validationErrors;
}


function validatePasswordForm(form, t) {
  const validationErrors = {};

  if (!form.new_password) {
    validationErrors.new_password =
      t("userManagement.newPasswordRequired");
  } else if (form.new_password.length < 8) {
    validationErrors.new_password =
      t("userManagement.passwordMinimum");
  } else if (form.new_password.length > 128) {
    validationErrors.new_password =
      t("userManagement.passwordMaximum");
  }

  if (!form.confirm_password) {
    validationErrors.confirm_password =
      t("userManagement.confirmPasswordRequired");
  } else if (
    form.new_password !==
    form.confirm_password
  ) {
    validationErrors.confirm_password =
      t("userManagement.passwordsMismatch");
  }

  return validationErrors;
}


function UserManagement() {
  const { language, t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");
  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /*
   * Create User
   */

  const [
    createDialogOpen,
    setCreateDialogOpen,
  ] = useState(false);

  const [createForm, setCreateForm] =
    useState(INITIAL_CREATE_FORM);

  const [createErrors, setCreateErrors] =
    useState({});

  const [creating, setCreating] =
    useState(false);

  const [
    showCreatePassword,
    setShowCreatePassword,
  ] = useState(false);

  /*
   * User Action Menu
   */

  const [
    actionAnchorEl,
    setActionAnchorEl,
  ] = useState(null);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  /*
   * Edit User
   */

  const [
    editDialogOpen,
    setEditDialogOpen,
  ] = useState(false);

  const [editForm, setEditForm] =
    useState(INITIAL_EDIT_FORM);

  const [editErrors, setEditErrors] =
    useState({});

  const [updating, setUpdating] =
    useState(false);

  /*
   * User Status
   */

  const [
    statusDialogOpen,
    setStatusDialogOpen,
  ] = useState(false);

  const [
    statusUpdating,
    setStatusUpdating,
  ] = useState(false);

  const [
    statusError,
    setStatusError,
  ] = useState("");

  /*
   * Reset Password
   */

  const [
    passwordDialogOpen,
    setPasswordDialogOpen,
  ] = useState(false);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState(INITIAL_PASSWORD_FORM);

  const [
    passwordErrors,
    setPasswordErrors,
  ] = useState({});

  const [
    passwordResetting,
    setPasswordResetting,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  const activeUsers = useMemo(
    () =>
      users.filter(
        (user) => user.is_active
      ).length,
    [users]
  );


  const inactiveUsers = useMemo(
    () =>
      users.filter(
        (user) => !user.is_active
      ).length,
    [users]
  );


  const loadUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await getUsers();

        setUsers(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (requestError) {
        setError(
          requestError?.message ||
            t("userManagement.loadError")
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );


  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  /*
   * Create User Handlers
   */

  const handleOpenCreateDialog = () => {
    setCreateForm(
      INITIAL_CREATE_FORM
    );
    setCreateErrors({});
    setShowCreatePassword(false);
    setCreateDialogOpen(true);
  };


  const handleCloseCreateDialog = () => {
    if (creating) {
      return;
    }

    setCreateDialogOpen(false);
    setCreateForm(
      INITIAL_CREATE_FORM
    );
    setCreateErrors({});
    setShowCreatePassword(false);
  };


  const handleCreateFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setCreateForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );

    setCreateErrors(
      (currentErrors) => ({
        ...currentErrors,
        [name]: "",
        form: "",
      })
    );
  };


  const handleCreateUser = async () => {
    const validationErrors =
      validateCreateForm(createForm, t);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setCreateErrors(
        validationErrors
      );
      return;
    }

    setCreating(true);
    setCreateErrors({});

    const payload = {
      full_name:
        createForm.full_name.trim(),

      email:
        createForm.email
          .trim()
          .toLowerCase(),

      password:
        createForm.password,

      role:
        createForm.role,
    };

    try {
      await createUser(payload);

      const createdUserName =
        createForm.full_name.trim();

      setCreateDialogOpen(false);
      setCreateForm(
        INITIAL_CREATE_FORM
      );
      setCreateErrors({});
      setShowCreatePassword(false);

      setSuccessMessage(
        t("userManagement.createdSuccess").replace("{name}", createdUserName)
      );

      await loadUsers(true);
    } catch (requestError) {
      setCreateErrors({
        form:
          requestError?.message ||
          t("userManagement.createError"),
      });
    } finally {
      setCreating(false);
    }
  };


  /*
   * Action Menu Handlers
   */

  const handleOpenActionMenu = (
    event,
    user
  ) => {
    setActionAnchorEl(
      event.currentTarget
    );
    setSelectedUser(user);
  };


  const handleCloseActionMenu = () => {
    setActionAnchorEl(null);
  };


  /*
   * Edit User Handlers
   */

  const handleOpenEditDialog = () => {
    if (!selectedUser) {
      return;
    }

    setEditForm({
      id: selectedUser.id,
      full_name:
        selectedUser.full_name || "",
      email:
        selectedUser.email || "",
      role:
        selectedUser.role || "Viewer",
    });

    setEditErrors({});
    setEditDialogOpen(true);
    handleCloseActionMenu();
  };


  const handleCloseEditDialog = () => {
    if (updating) {
      return;
    }

    setEditDialogOpen(false);
    setEditForm(
      INITIAL_EDIT_FORM
    );
    setEditErrors({});
    setSelectedUser(null);
  };


  const handleEditFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setEditForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );

    setEditErrors(
      (currentErrors) => ({
        ...currentErrors,
        [name]: "",
        form: "",
      })
    );
  };


  const handleUpdateUser = async () => {
    const validationErrors =
      validateUserFields(editForm, t);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setEditErrors(
        validationErrors
      );
      return;
    }

    if (!editForm.id) {
      setEditErrors({
        form:
          t("userManagement.invalidSelection"),
      });
      return;
    }

    setUpdating(true);
    setEditErrors({});

    const payload = {
      full_name:
        editForm.full_name.trim(),

      email:
        editForm.email
          .trim()
          .toLowerCase(),

      role:
        editForm.role,
    };

    try {
      await updateUser(
        editForm.id,
        payload
      );

      const updatedUserName =
        editForm.full_name.trim();

      setEditDialogOpen(false);
      setEditForm(
        INITIAL_EDIT_FORM
      );
      setEditErrors({});
      setSelectedUser(null);

      setSuccessMessage(
        t("userManagement.updatedSuccess").replace("{name}", updatedUserName)
      );

      await loadUsers(true);
    } catch (requestError) {
      setEditErrors({
        form:
          requestError?.message ||
          t("userManagement.updateError"),
      });
    } finally {
      setUpdating(false);
    }
  };


  /*
   * Status Change Handlers
   */

  const handleOpenStatusDialog = () => {
    if (!selectedUser) {
      return;
    }

    setStatusError("");
    setStatusDialogOpen(true);
    handleCloseActionMenu();
  };


  const handleCloseStatusDialog = () => {
    if (statusUpdating) {
      return;
    }

    setStatusDialogOpen(false);
    setStatusError("");
    setSelectedUser(null);
  };


  const handleConfirmStatusChange =
    async () => {
      if (!selectedUser) {
        setStatusError(
          t("userManagement.invalidSelection")
        );
        return;
      }

      const nextStatus =
        !selectedUser.is_active;

      setStatusUpdating(true);
      setStatusError("");

      try {
        await updateUserStatus(
          selectedUser.id,
          nextStatus
        );

        const selectedUserName =
          selectedUser.full_name;

        setSuccessMessage(
          t(nextStatus ? "userManagement.activatedSuccess" : "userManagement.deactivatedSuccess")
            .replace("{name}", selectedUserName)
        );

        setStatusDialogOpen(false);
        setSelectedUser(null);

        await loadUsers(true);
      } catch (requestError) {
        setStatusError(
          requestError?.message ||
            t("userManagement.statusError")
        );
      } finally {
        setStatusUpdating(false);
      }
    };


  /*
   * Reset Password Handlers
   */

  const handleOpenPasswordDialog = () => {
    if (!selectedUser) {
      return;
    }

    setPasswordForm(
      INITIAL_PASSWORD_FORM
    );
    setPasswordErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordDialogOpen(true);
    handleCloseActionMenu();
  };


  const handleClosePasswordDialog = () => {
    if (passwordResetting) {
      return;
    }

    setPasswordDialogOpen(false);
    setPasswordForm(
      INITIAL_PASSWORD_FORM
    );
    setPasswordErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setSelectedUser(null);
  };


  const handlePasswordFormChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setPasswordForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );

    setPasswordErrors(
      (currentErrors) => ({
        ...currentErrors,
        [name]: "",
        form: "",
      })
    );
  };


  const handleResetPassword = async () => {
    const validationErrors =
      validatePasswordForm(passwordForm, t);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setPasswordErrors(
        validationErrors
      );
      return;
    }

    if (!selectedUser) {
      setPasswordErrors({
        form:
          t("userManagement.invalidSelection"),
      });
      return;
    }

    setPasswordResetting(true);
    setPasswordErrors({});

    try {
      await resetUserPassword(
        selectedUser.id,
        passwordForm.new_password
      );

      const selectedUserName =
        selectedUser.full_name;

      setPasswordDialogOpen(false);
      setPasswordForm(
        INITIAL_PASSWORD_FORM
      );
      setPasswordErrors({});
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setSelectedUser(null);

      setSuccessMessage(
        t("userManagement.passwordResetSuccess").replace("{name}", selectedUserName)
      );
    } catch (requestError) {
      setPasswordErrors({
        form:
          requestError?.message ||
          t("userManagement.passwordResetError"),
      });
    } finally {
      setPasswordResetting(false);
    }
  };


  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Page Header */}
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        justifyContent="space-between"
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
        spacing={2}
        sx={{
          mb: 3,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.main",
              color:
                "primary.contrastText",
              flexShrink: 0,
            }}
          >
            <ManageAccountsIcon />
          </Box>

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              {t("userManagement.title")}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {t("userManagement.subtitle")}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
        >
          <Button
            variant="outlined"
            startIcon={
              refreshing ? (
                <CircularProgress
                  size={16}
                />
              ) : (
                <RefreshIcon />
              )
            }
            disabled={refreshing}
            onClick={() =>
              loadUsers(true)
            }
          >
            {t("common.refresh")}
          </Button>

          <Button
            variant="contained"
            startIcon={
              <PersonAddAlt1Icon />
            }
            onClick={
              handleOpenCreateDialog
            }
          >
            {t("userManagement.newUser")}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{
          mb: 3,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            minWidth: 180,
            flex: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t("userManagement.totalUsers")}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.5,
              fontWeight: 700,
            }}
          >
            {users.length}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            minWidth: 180,
            flex: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t("userManagement.activeUsers")}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.5,
              fontWeight: 700,
            }}
          >
            {activeUsers}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            minWidth: 180,
            flex: 1,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t("userManagement.inactiveUsers")}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mt: 0.5,
              fontWeight: 700,
            }}
          >
            {inactiveUsers}
          </Typography>
        </Paper>
      </Stack>

      {/* Users Table */}
      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom:
              "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            {t("userManagement.companyUsers")}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t("userManagement.companyUsersDescription")}
          </Typography>
        </Box>

        {loading ? (
          <Box
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Stack
              alignItems="center"
              spacing={1.5}
            >
              <CircularProgress />

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {t("userManagement.loading")}
              </Typography>
            </Stack>
          </Box>
        ) : users.length === 0 ? (
          <Box
            sx={{
              minHeight: 260,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Stack
              spacing={1.5}
              alignItems="center"
            >
              <ManageAccountsIcon
                sx={{
                  fontSize: 48,
                  color:
                    "text.disabled",
                }}
              />

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {t("userManagement.emptyTitle")}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {t("userManagement.emptyDescription")}
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={
                  <PersonAddAlt1Icon />
                }
                onClick={
                  handleOpenCreateDialog
                }
              >
                {t("userManagement.createUser")}
              </Button>
            </Stack>
          </Box>
        ) : (
          <TableContainer>
            <Table
              sx={{
                minWidth: 850,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    {t("userManagement.name")}
                  </TableCell>
                  <TableCell>
                    {t("userManagement.email")}
                  </TableCell>
                  <TableCell>
                    {t("userManagement.role")}
                  </TableCell>
                  <TableCell>
                    {t("userManagement.status")}
                  </TableCell>
                  <TableCell>
                    {t("userManagement.created")}
                  </TableCell>
                  <TableCell align="right">
                    {t("userManagement.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        {user.full_name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {t("userManagement.userId")}: {user.id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role, t)}
                        color={getRoleChipColor(
                          user.role
                        )}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          user.is_active
                            ? t("userManagement.active")
                            : t("userManagement.inactive")
                        }
                        color={
                          user.is_active
                            ? "success"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      {formatDisplayDate(
                        user.created_at,
                        language
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={t("userManagement.manageUser").replace("{name}", user.full_name)}
                        onClick={(event) =>
                          handleOpenActionMenu(
                            event,
                            user
                          )
                        }
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* User Action Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(
          actionAnchorEl
        )}
        onClose={
          handleCloseActionMenu
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={
            handleOpenEditDialog
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>

          <ListItemText>
            {t("userManagement.editUser")}
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={
            handleOpenPasswordDialog
          }
        >
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>

          <ListItemText>
            {t("userManagement.resetPassword")}
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={
            handleOpenStatusDialog
          }
        >
          <ListItemIcon>
            {selectedUser?.is_active ? (
              <PersonOffIcon
                fontSize="small"
                color="error"
              />
            ) : (
              <PersonIcon
                fontSize="small"
                color="success"
              />
            )}
          </ListItemIcon>

          <ListItemText>
            {selectedUser?.is_active
              ? t("userManagement.deactivateUser")
              : t("userManagement.activateUser")}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={
          handleCloseCreateDialog
        }
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 2,
            pr: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              {t("userManagement.createNewUser")}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {t("userManagement.createDescription")}
            </Typography>
          </Box>

          <IconButton
            aria-label={t("userManagement.closeCreateDialog")}
            onClick={
              handleCloseCreateDialog
            }
            disabled={creating}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {createErrors.form && (
              <Alert severity="error">
                {createErrors.form}
              </Alert>
            )}

            <TextField
              label={t("userManagement.fullName")}
              name="full_name"
              value={
                createForm.full_name
              }
              onChange={
                handleCreateFormChange
              }
              error={Boolean(
                createErrors.full_name
              )}
              helperText={
                createErrors.full_name
              }
              autoComplete="name"
              autoFocus
              required
              fullWidth
              disabled={creating}
            />

            <TextField
              label={t("userManagement.emailAddress")}
              name="email"
              type="email"
              value={createForm.email}
              onChange={
                handleCreateFormChange
              }
              error={Boolean(
                createErrors.email
              )}
              helperText={
                createErrors.email
              }
              autoComplete="email"
              required
              fullWidth
              disabled={creating}
            />

            <TextField
              label={t("userManagement.temporaryPassword")}
              name="password"
              type={
                showCreatePassword
                  ? "text"
                  : "password"
              }
              value={
                createForm.password
              }
              onChange={
                handleCreateFormChange
              }
              error={Boolean(
                createErrors.password
              )}
              helperText={
                createErrors.password ||
                t("userManagement.minimumCharacters")
              }
              autoComplete="new-password"
              required
              fullWidth
              disabled={creating}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showCreatePassword
                            ? t("userManagement.hidePassword")
                            : t("userManagement.showPassword")
                        }
                        onClick={() =>
                          setShowCreatePassword(
                            (currentValue) =>
                              !currentValue
                          )
                        }
                        edge="end"
                        disabled={
                          creating
                        }
                      >
                        {showCreatePassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControl
              fullWidth
              required
              error={Boolean(
                createErrors.role
              )}
              disabled={creating}
            >
              <InputLabel id="create-user-role-label">
                {t("userManagement.role")}
              </InputLabel>

              <Select
                labelId="create-user-role-label"
                label={t("userManagement.role")}
                name="role"
                value={createForm.role}
                onChange={
                  handleCreateFormChange
                }
              >
                {ROLE_OPTIONS.map(
                  (role) => (
                    <MenuItem
                      key={role}
                      value={role}
                    >
                      {getRoleLabel(role, t)}
                    </MenuItem>
                  )
                )}
              </Select>

              {createErrors.role && (
                <FormHelperText>
                  {createErrors.role}
                </FormHelperText>
              )}
            </FormControl>

            <Alert severity="info">
              {t("userManagement.createInfo")}
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            type="button"
            onClick={
              handleCloseCreateDialog
            }
            disabled={creating}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            variant="contained"
            disabled={creating}
            onClick={
              handleCreateUser
            }
            startIcon={
              creating ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <PersonAddAlt1Icon />
              )
            }
          >
            {creating
              ? t("userManagement.creating")
              : t("userManagement.createUser")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={
          handleCloseEditDialog
        }
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 2,
            pr: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              {t("userManagement.editUser")}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {t("userManagement.editDescription")}
            </Typography>
          </Box>

          <IconButton
            aria-label={t("userManagement.closeEditDialog")}
            onClick={
              handleCloseEditDialog
            }
            disabled={updating}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {editErrors.form && (
              <Alert severity="error">
                {editErrors.form}
              </Alert>
            )}

            <TextField
              label={t("userManagement.fullName")}
              name="full_name"
              value={
                editForm.full_name
              }
              onChange={
                handleEditFormChange
              }
              error={Boolean(
                editErrors.full_name
              )}
              helperText={
                editErrors.full_name
              }
              autoComplete="name"
              autoFocus
              required
              fullWidth
              disabled={updating}
            />

            <TextField
              label={t("userManagement.emailAddress")}
              name="email"
              type="email"
              value={editForm.email}
              onChange={
                handleEditFormChange
              }
              error={Boolean(
                editErrors.email
              )}
              helperText={
                editErrors.email
              }
              autoComplete="email"
              required
              fullWidth
              disabled={updating}
            />

            <FormControl
              fullWidth
              required
              error={Boolean(
                editErrors.role
              )}
              disabled={updating}
            >
              <InputLabel id="edit-user-role-label">
                {t("userManagement.role")}
              </InputLabel>

              <Select
                labelId="edit-user-role-label"
                label={t("userManagement.role")}
                name="role"
                value={editForm.role}
                onChange={
                  handleEditFormChange
                }
              >
                {ROLE_OPTIONS.map(
                  (role) => (
                    <MenuItem
                      key={role}
                      value={role}
                    >
                      {getRoleLabel(role, t)}
                    </MenuItem>
                  )
                )}
              </Select>

              {editErrors.role && (
                <FormHelperText>
                  {editErrors.role}
                </FormHelperText>
              )}
            </FormControl>

            <Alert severity="info">
              {t("userManagement.editInfo")}
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            type="button"
            onClick={
              handleCloseEditDialog
            }
            disabled={updating}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            variant="contained"
            disabled={updating}
            onClick={
              handleUpdateUser
            }
            startIcon={
              updating ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <EditIcon />
              )
            }
          >
            {updating
              ? t("userManagement.saving")
              : t("userManagement.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Confirmation Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={
          handleCloseStatusDialog
        }
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor:
                  selectedUser?.is_active
                    ? "#fee2e2"
                    : "#dcfce7",
                color:
                  selectedUser?.is_active
                    ? "error.main"
                    : "success.main",
              }}
            >
              <WarningAmberIcon />
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                {selectedUser?.is_active
                  ? t("userManagement.deactivateUser")
                  : t("userManagement.activateUser")}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {t("userManagement.statusDescription")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            {statusError && (
              <Alert severity="error">
                {statusError}
              </Alert>
            )}

            <Typography variant="body1">
              {selectedUser?.is_active
                ? t("userManagement.deactivateConfirm").replace("{name}", selectedUser?.full_name || "")
                : t("userManagement.activateConfirm").replace("{name}", selectedUser?.full_name || "")}
            </Typography>

            {selectedUser?.role ===
              "Administrator" && (
              <Alert severity="warning">
                {t("userManagement.administratorWarning")}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            type="button"
            onClick={
              handleCloseStatusDialog
            }
            disabled={statusUpdating}
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            variant="contained"
            color={
              selectedUser?.is_active
                ? "error"
                : "success"
            }
            disabled={statusUpdating}
            onClick={
              handleConfirmStatusChange
            }
            startIcon={
              statusUpdating ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : selectedUser?.is_active ? (
                <PersonOffIcon />
              ) : (
                <PersonIcon />
              )
            }
          >
            {statusUpdating
              ? t("userManagement.updating")
              : selectedUser?.is_active
                ? t("userManagement.deactivate")
                : t("userManagement.activate")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={
          handleClosePasswordDialog
        }
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 2,
            pr: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "#dbeafe",
                color: "primary.main",
              }}
            >
              <LockResetIcon />
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                {t("userManagement.resetPassword")}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {t("userManagement.resetDescription")}
              </Typography>
            </Box>
          </Stack>

          <IconButton
            aria-label={t("userManagement.closeResetDialog")}
            onClick={
              handleClosePasswordDialog
            }
            disabled={
              passwordResetting
            }
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {passwordErrors.form && (
              <Alert severity="error">
                {passwordErrors.form}
              </Alert>
            )}

            <Alert severity="info">
              Resetting the password for{" "}
              <strong>
                {selectedUser?.full_name}
              </strong>
              {selectedUser?.email
                ? ` (${selectedUser.email})`
                : ""}
              . {t("userManagement.shareSecurely")}
            </Alert>

            <TextField
              label={t("userManagement.newTemporaryPassword")}
              name="new_password"
              type={
                showNewPassword
                  ? "text"
                  : "password"
              }
              value={
                passwordForm.new_password
              }
              onChange={
                handlePasswordFormChange
              }
              error={Boolean(
                passwordErrors.new_password
              )}
              helperText={
                passwordErrors.new_password ||
                t("userManagement.minimumCharacters")
              }
              autoComplete="new-password"
              autoFocus
              required
              fullWidth
              disabled={
                passwordResetting
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showNewPassword
                            ? t("userManagement.hideNewPassword")
                            : t("userManagement.showNewPassword")
                        }
                        onClick={() =>
                          setShowNewPassword(
                            (currentValue) =>
                              !currentValue
                          )
                        }
                        edge="end"
                        disabled={
                          passwordResetting
                        }
                      >
                        {showNewPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label={t("userManagement.confirmNewPassword")}
              name="confirm_password"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={
                passwordForm.confirm_password
              }
              onChange={
                handlePasswordFormChange
              }
              error={Boolean(
                passwordErrors.confirm_password
              )}
              helperText={
                passwordErrors.confirm_password
              }
              autoComplete="new-password"
              required
              fullWidth
              disabled={
                passwordResetting
              }
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showConfirmPassword
                            ? t("userManagement.hideConfirmedPassword")
                            : t("userManagement.showConfirmedPassword")
                        }
                        onClick={() =>
                          setShowConfirmPassword(
                            (currentValue) =>
                              !currentValue
                          )
                        }
                        edge="end"
                        disabled={
                          passwordResetting
                        }
                      >
                        {showConfirmPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Alert severity="warning">
              {t("userManagement.sessionWarning")}
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
          }}
        >
          <Button
            type="button"
            onClick={
              handleClosePasswordDialog
            }
            disabled={
              passwordResetting
            }
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="button"
            variant="contained"
            disabled={
              passwordResetting
            }
            onClick={
              handleResetPassword
            }
            startIcon={
              passwordResetting ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <LockResetIcon />
              )
            }
          >
            {passwordResetting
              ? t("userManagement.resetting")
              : t("userManagement.resetPassword")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={Boolean(
          successMessage
        )}
        autoHideDuration={5000}
        onClose={() =>
          setSuccessMessage("")
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{
            width: "100%",
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}


export default UserManagement;
