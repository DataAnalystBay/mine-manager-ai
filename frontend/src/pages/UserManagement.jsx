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


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}


function validateUserFields({
  full_name,
  email,
  role,
}) {
  const validationErrors = {};

  const normalizedName =
    full_name?.trim() || "";

  const normalizedEmail =
    email?.trim() || "";

  if (!normalizedName) {
    validationErrors.full_name =
      "Full name is required.";
  } else if (normalizedName.length < 2) {
    validationErrors.full_name =
      "Full name must contain at least 2 characters.";
  }

  if (!normalizedEmail) {
    validationErrors.email =
      "Email address is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    )
  ) {
    validationErrors.email =
      "Enter a valid email address.";
  }

  if (!role) {
    validationErrors.role =
      "Role is required.";
  }

  return validationErrors;
}


function validateCreateForm(form) {
  const validationErrors =
    validateUserFields(form);

  if (!form.password) {
    validationErrors.password =
      "Password is required.";
  } else if (form.password.length < 8) {
    validationErrors.password =
      "Password must contain at least 8 characters.";
  }

  return validationErrors;
}


function validatePasswordForm(form) {
  const validationErrors = {};

  if (!form.new_password) {
    validationErrors.new_password =
      "New password is required.";
  } else if (form.new_password.length < 8) {
    validationErrors.new_password =
      "Password must contain at least 8 characters.";
  } else if (form.new_password.length > 128) {
    validationErrors.new_password =
      "Password must not exceed 128 characters.";
  }

  if (!form.confirm_password) {
    validationErrors.confirm_password =
      "Confirm the new password.";
  } else if (
    form.new_password !==
    form.confirm_password
  ) {
    validationErrors.confirm_password =
      "Passwords do not match.";
  }

  return validationErrors;
}


function UserManagement() {
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
            "Unable to load users."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
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
      validateCreateForm(createForm);

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
        `${createdUserName} was created successfully.`
      );

      await loadUsers(true);
    } catch (requestError) {
      setCreateErrors({
        form:
          requestError?.message ||
          "Unable to create the user.",
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
      validateUserFields(editForm);

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
          "A valid user was not selected.",
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
        `${updatedUserName} was updated successfully.`
      );

      await loadUsers(true);
    } catch (requestError) {
      setEditErrors({
        form:
          requestError?.message ||
          "Unable to update the user.",
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
          "A valid user was not selected."
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

        const actionText =
          nextStatus
            ? "activated"
            : "deactivated";

        const selectedUserName =
          selectedUser.full_name;

        setSuccessMessage(
          `${selectedUserName} was ${actionText} successfully.`
        );

        setStatusDialogOpen(false);
        setSelectedUser(null);

        await loadUsers(true);
      } catch (requestError) {
        setStatusError(
          requestError?.message ||
            "Unable to update the user status."
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
      validatePasswordForm(
        passwordForm
      );

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
          "A valid user was not selected.",
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
        `${selectedUserName}'s password was reset successfully.`
      );
    } catch (requestError) {
      setPasswordErrors({
        form:
          requestError?.message ||
          "Unable to reset the password.",
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
              User Management
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Manage company users,
              access roles, and account
              status.
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
            Refresh
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
            New User
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
            Total Users
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
            Active Users
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
            Inactive Users
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
            Company Users
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Users assigned to your
            current company account.
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
                Loading users...
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
                  No users found
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  Create the first company
                  user to begin managing
                  access.
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
                Create User
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
                    Name
                  </TableCell>
                  <TableCell>
                    Email
                  </TableCell>
                  <TableCell>
                    Role
                  </TableCell>
                  <TableCell>
                    Status
                  </TableCell>
                  <TableCell>
                    Created
                  </TableCell>
                  <TableCell align="right">
                    Actions
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
                        User ID: {user.id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.role}
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
                            ? "Active"
                            : "Inactive"
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
                      {formatDate(
                        user.created_at
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={`Manage ${user.full_name}`}
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
            Edit User
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
            Reset Password
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
              ? "Deactivate User"
              : "Activate User"}
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
              Create New User
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Add a user to the
              current company account.
            </Typography>
          </Box>

          <IconButton
            aria-label="Close create user dialog"
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
              label="Full Name"
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
              label="Email Address"
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
              label="Temporary Password"
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
                "Minimum 8 characters."
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
                            ? "Hide password"
                            : "Show password"
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
                Role
              </InputLabel>

              <Select
                labelId="create-user-role-label"
                label="Role"
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
                      {role}
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
              The new account will be
              active immediately. The
              user can sign in using the
              email address and temporary
              password entered above.
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
            Cancel
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
              ? "Creating..."
              : "Create User"}
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
              Edit User
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Update the user profile
              and access role.
            </Typography>
          </Box>

          <IconButton
            aria-label="Close edit user dialog"
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
              label="Full Name"
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
              label="Email Address"
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
                Role
              </InputLabel>

              <Select
                labelId="edit-user-role-label"
                label="Role"
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
                      {role}
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
              Updating this user changes
              their profile and assigned
              role. It does not change
              their password or active
              status.
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
            Cancel
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
              ? "Saving..."
              : "Save Changes"}
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
                  ? "Deactivate User"
                  : "Activate User"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Confirm the account
                status change.
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
                ? `Deactivate ${selectedUser?.full_name}? This user will no longer be able to sign in.`
                : `Activate ${selectedUser?.full_name}? This user will be able to sign in again.`}
            </Typography>

            {selectedUser?.role ===
              "Administrator" && (
              <Alert severity="warning">
                Administrator accounts
                should only be deactivated
                when another active
                administrator can manage
                the company.
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
            Cancel
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
              ? "Updating..."
              : selectedUser?.is_active
                ? "Deactivate"
                : "Activate"}
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
                Reset Password
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Set a new temporary
                password for this user.
              </Typography>
            </Box>
          </Stack>

          <IconButton
            aria-label="Close reset password dialog"
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
              . Share the temporary
              password securely.
            </Alert>

            <TextField
              label="New Temporary Password"
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
                "Minimum 8 characters."
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
                            ? "Hide new password"
                            : "Show new password"
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
              label="Confirm New Password"
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
                            ? "Hide confirmed password"
                            : "Show confirmed password"
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
              Existing sessions may
              remain active until their
              authentication tokens
              expire. The new password is
              required for the user's
              next login.
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
            Cancel
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
              ? "Resetting..."
              : "Reset Password"}
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
