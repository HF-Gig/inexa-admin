import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Grid,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { Edit, Delete, Add, Visibility, VisibilityOff, CheckCircle, Error } from "@mui/icons-material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { countries } from 'countries-list';
import countriesData from '../../assets/countries.json';
import { Header } from "../../components";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import { IconButton } from "@mui/material";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
console.log('users :>> ', users);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [dialogMode, setDialogMode] = useState("add");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    userId: null,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Validation schema
  const UserSchema = Yup.object().shape({
    first_name: Yup.string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(30, "First name must be at most 30 characters")
      .required("First name is required"),
    last_name: Yup.string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(30, "First name must be at most 30 characters")
      .required("Last name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(10, "Password must be at least 10 characters")
      .matches(/[a-z]/, 'At least one lowercase letter required')
      .matches(/[A-Z]/, 'At least one uppercase letter required')
      .matches(/[0-9]/, 'At least one number required')
      .when([dialogMode], {
        is: () => dialogMode === "add",
        then: (schema) => schema.required("Password is required"),
        otherwise: (schema) => schema.notRequired(),
      }),
    country_code: Yup.string().required("Country code is required"),
    phone: Yup.string()
      .matches(/^\d{7,15}$/, "Phone must be 7-15 digits")
      .required("Phone is required"),
  });

  // Fetch users on component mount and when pagination changes
  useEffect(() => {
    fetchUsers(page, rowsPerPage);
  }, [page, rowsPerPage]);

  const fetchUsers = async (pageNum = 0, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/users?page=${pageNum + 1}&page_size=${pageSize}`);
      setUsers(response.data);
      setTotal(response.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch users",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setDialogMode("add");
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setDialogMode("edit");
    setOpenDialog(true);
  };

  const openDeleteDialog = (userId) => {
    setConfirmDelete({ open: true, userId });
  };

  const closeDeleteDialog = () => {
    setConfirmDelete({ open: false, userId: null });
  };

  const confirmDeleteUser = async () => {
    if (confirmDelete.userId) {
      await handleDeleteUser(confirmDelete.userId);
      closeDeleteDialog();
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers({...users, data: users.data.filter(user => user.id !== userId)});
      setSnackbar({
        open: true,
        message: "User deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete user",
        severity: "error",
      });
    }
  };

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      // Find the country name from the selected country code
      const selectedCountry = countriesData.find(country => `+${country.code}` === values.country_code);
      const countryName = selectedCountry ? selectedCountry.country : '';

      const dataToSend = {
        ...values,
        phone: `${values.country_code} ${values.phone}`,
        country: countryName,
      };
      if (dialogMode === "add") {
        await api.post("/users", dataToSend);
        setSnackbar({
          open: true,
          message: "User added successfully!",
          severity: "success",
        });
      } else {
        if (!editingUser?.id) {
          throw new Error("User ID is required for update");
        }
        await api.put(`/users/${editingUser.id}`, dataToSend);
        setUsers(
          {...users, data : users?.data.map((user) =>
            user.id === editingUser.id ? { ...user, ...dataToSend } : user
          )}
        );
        setSnackbar({
          open: true,
          message: "User updated successfully!",
          severity: "success",
        });
      }
      resetForm();
      setOpenDialog(false);
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to save user",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        m="20px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Apply frontend filtering by name or email
let filteredUsers = users?.data?.filter((u) => {
  const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
  const email = u.email?.toLowerCase() || "";
  const term = searchTerm.toLowerCase();
  return fullName.includes(term) || email.includes(term);
})
  .map((u) => ({
    ...u,
    name: `${u.first_name} ${u.last_name}`,
  }));

// Apply frontend sorting
if (sortCol && filteredUsers) {
  filteredUsers.sort((a, b) => {
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    } else {
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    }
  });
}
  
  return (
    <Box>
      <Header
        title="Learners"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={handleAddUser}>
            Add Learner
          </Button>
        }
      />

      <Box mt={1} mb={2}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Search learners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            background: "#f5f7fa",
            borderRadius: 2,
            minHeight: 44,
            maxWidth: 350,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              fontSize: 16,
              paddingLeft: 1,
              background: "#f5f7fa",
              "& fieldset": {
                borderColor: "#e0e6ed",
              },
              "&:hover fieldset": {
                borderColor: "#1976d2",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1976d2",
                boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.08)",
              },
            },
          }}
        />
      </Box>

      <CommonTable
        columns={[
          { name: "id", label: "ID" },
          { name: "name", label: "Name" },
          { name: "email", label: "Email" },
          { name: "country", label: "Country" },
          { name: "phone", label: "Phone" },
        ]}
        data={filteredUsers || []}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={loading}
        onPageChange={setPage}
        onRowsPerPageChange={(e) => setRowsPerPage(e?.target.value)}
        sortCol={sortCol}
        sortDir={sortDir}
        onSortChange={(col, dir) => {
          setSortCol(col || "id");
          setSortDir(dir);
        }}
        actions={user => (
          <Box display="flex" gap={1}>
            <IconButton onClick={() => handleEditUser(user)} title="Edit">
              <Edit fontSize="small" className="icon" sx={{ color: '#ff9800' }} />
            </IconButton>
            <IconButton onClick={() => openDeleteDialog(user.id)} title="Delete">
              <Delete fontSize="small" className="icon" sx={{ color: '#f44336' }} />
            </IconButton>
          </Box>
        )}
      />

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 8px 32px rgba(40,40,40,0.18)",
            p: { xs: 1, sm: 3 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: 26,
            color: "#3322FF",
            pb: 2,
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          {dialogMode === "add" ? "Add New Learner" : "Edit Learner"}
        </DialogTitle>
        <Formik
          initialValues={
            editingUser ? (() => {
              const phoneParts = (editingUser.phone || '').split(' ');
              return {
                ...editingUser,
                country_code: phoneParts[0] || '+1',
                phone: phoneParts.slice(1).join(' ') || '',
              };
            })() : {
              first_name: "",
              last_name: "",
              email: "",
              password: "",
              country_code: "+1",
              phone: "",
            }
          }
          validationSchema={UserSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            isSubmitting,
          }) => (
            <Form>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#222",
                      mb: 0.5,
                      ml: 0.5,
                    }}
                  >
                    First Name  <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Field
                    as={TextField}
                    name="first_name"
                    label=""
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#F8F9FF",
                        fontSize: 17,
                        fontWeight: 500,
                        "&.Mui-focused fieldset": {
                          borderColor: "#3322FF",
                          boxShadow: "0 0 0 2px #E0E7FF",
                        },
                        "&.MuiInputBase-formControl": {
                          height: "50px"
                        }
                      },
                    }}
                    value={values.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.first_name && Boolean(errors.first_name)}
                    helperText={
                      touched.first_name && errors.first_name ? (
                        <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                          {errors.first_name}
                        </span>
                      ) : null
                    }
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#222",
                      mb: 0.5,
                      ml: 0.5,
                    }}
                  >
                    Last Name <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Field
                    as={TextField}
                    name="last_name"
                    label=""
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#F8F9FF",
                        fontSize: 17,
                        fontWeight: 500,
                        "&.Mui-focused fieldset": {
                          borderColor: "#3322FF",
                          boxShadow: "0 0 0 2px #E0E7FF",
                        },
                        "&.MuiInputBase-formControl": {
                          height: "50px"
                        }
                      },
                    }}
                    value={values.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.last_name && Boolean(errors.last_name)}
                    helperText={
                      touched.last_name && errors.last_name ? (
                        <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                          {errors.last_name}
                        </span>
                      ) : null
                    }
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#222",
                      mb: 0.5,
                      ml: 0.5,
                    }}
                  >
                    Email <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Field
                    as={TextField}
                    name="email"
                    label=""
                    fullWidth
                    variant="outlined"
                    autoComplete="off"
                    sx={{
                      borderRadius: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#F8F9FF",
                        fontSize: 17,
                        fontWeight: 500,
                        "&.Mui-focused fieldset": {
                          borderColor: "#3322FF",
                          boxShadow: "0 0 0 2px #E0E7FF",
                        },
                        "&.MuiInputBase-formControl": {
                          height: "50px"
                        }
                      },
                    }}
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={
                      touched.email && errors.email ? (
                        <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                          {errors.email}
                        </span>
                      ) : null
                    }
                  />
                </Box>
                <Box>
                  {dialogMode === "add" && (
                    <>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: "#222",
                          mb: 0.5,
                          ml: 0.5,
                        }}
                      >
                        Password <span style={{ color: 'red' }}> *</span>
                      </Typography>
                      <Field
                        as={TextField}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        label=""
                        fullWidth
                        variant="outlined"
                        autoComplete="off"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                sx={{ p: 0.5, color: 'black', pr: 2 }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          borderRadius: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                            background: "#F8F9FF",
                            fontSize: 17,
                            fontWeight: 500,
                            "&.Mui-focused fieldset": {
                              borderColor: "#3322FF",
                              boxShadow: "0 0 0 2px #E0E7FF",
                            },
                            "&.MuiInputBase-formControl": {
                              height: "50px"
                            }
                          },
                        }}
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.password && Boolean(errors.password)}
                      />
                      {
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {values.password.length >= 10 ? (
                                <CheckCircle sx={{ color: '#3322FF', fontSize: 16 }} />
                              ) : (
                                <Error sx={{ color: 'red', fontSize: 16 }} />
                              )}
                              <Typography sx={{ color: values.password.length >= 10 ? '#3322FF' : 'red', fontSize: 12 }}>
                                At least 10 characters
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {/[a-z]/.test(values.password) ? (
                                <CheckCircle sx={{ color: '#3322FF', fontSize: 16 }} />
                              ) : (
                                <Error sx={{ color: 'red', fontSize: 16 }} />
                              )}
                              <Typography sx={{ color: /[a-z]/.test(values.password) ? '#3322FF' : 'red', fontSize: 12 }}>
                                One lowercase letter
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {/[A-Z]/.test(values.password) ? (
                                <CheckCircle sx={{ color: '#3322FF', fontSize: 16 }} />
                              ) : (
                                <Error sx={{ color: 'red', fontSize: 16 }} />
                              )}
                              <Typography sx={{ color: /[A-Z]/.test(values.password) ? '#3322FF' : 'red', fontSize: 12 }}>
                                One uppercase letter
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {/[0-9]/.test(values.password) ? (
                                <CheckCircle sx={{ color: '#3322FF', fontSize: 16 }} />
                              ) : (
                                <Error sx={{ color: 'red', fontSize: 16 }} />
                              )}
                              <Typography sx={{ color: /[0-9]/.test(values.password) ? '#3322FF' : 'red', fontSize: 12 }}>
                                One number
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      }
                    </>
                  )}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#222",
                      mb: 0.5,
                      ml: 0.5,
                    }}
                  >
                    Phone Number <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Grid container spacing={1} alignItems="flex-start">
                    <Grid item xs={12}>
                      <Field name="country_code">
                        {({ field, form, meta }) => (
                          <Autocomplete
                            {...field}
                            options={countriesData}
                            getOptionLabel={(option) => `${option.country} (+${option.code})`}
                            value={countriesData.find(country => `+${country.code}` === field.value) || null}
                            onChange={(event, newValue) => {
                              form.setFieldValue('country_code', newValue ? `+${newValue.code}` : '');
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                variant="outlined"
                                placeholder="Search country..."
                                sx={{
                                  borderRadius: 3,
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                    background: "#F8F9FF",
                                    fontSize: 17,
                                    fontWeight: 500,
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#3322FF",
                                      boxShadow: "0 0 0 2px #E0E7FF",
                                    },
                                    "&.MuiInputBase-formControl": {
                                      height: "50px"
                                    }
                                  },
                                }}
                                error={meta.touched && Boolean(meta.error)}
                              />
                            )}
                            renderOption={(props, option) => (
                              <li {...props}>
                                {option.country} (+{option.code})
                              </li>
                            )}
                          />
                        )}
                      </Field>
                      {touched.country_code && errors.country_code && (
                        <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                          {errors.country_code}
                        </span>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        name="phone"
                        label=""
                        fullWidth
                        variant="outlined"
                        inputProps={{
                          maxLength: 15,
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                        }}
                        sx={{
                          borderRadius: 3,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                            background: "#F8F9FF",
                            fontSize: 17,
                            fontWeight: 500,
                            "&.Mui-focused fieldset": {
                              borderColor: "#3322FF",
                              boxShadow: "0 0 0 2px #E0E7FF",
                            },
                            "&.MuiInputBase-formControl": {
                              height: "50px"
                            },
                          },
                        }}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\D/g, "");
                        }}
                        value={values.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.phone && Boolean(errors.phone)}
                        helperText={
                          touched.phone && errors.phone ? (
                            <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                              {errors.phone}
                            </span>
                          ) : null
                        }
                        placeholder="1234567890"
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
              <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
                <Button
                  onClick={() => setOpenDialog(false)}
                  disabled={isSubmitting}
                  variant="outlined"
                  sx={{
                    borderColor: "#3322FF",
                    color: "#3322FF",
                    fontWeight: 700,
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    fontSize: 16,
                    "&:hover": {
                      background: "#F0F4FF",
                      borderColor: "#3322FF",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    background: "#3322FF",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: 3,
                    px: 3,
                    py: 1,
                    fontSize: 16,
                    boxShadow: "0 2px 8px rgba(51,34,255,0.08)",
                    "&:hover": {
                      background: "#2211AA",
                    },
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={20} />
                  ) : dialogMode === "add" ? (
                    "Add"
                  ) : (
                    "Update"
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={closeDeleteDialog}
        PaperProps={{
          sx: {
            background: "#fff"
          },
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button
            onClick={confirmDeleteUser}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
