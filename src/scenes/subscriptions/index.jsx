import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    Typography,
    CircularProgress,
    TextField,
    Autocomplete,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    IconButton,
    Snackbar,
    Alert,
    InputAdornment
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Header } from "../../components";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import dayjs from "dayjs";

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState("add"); // "add" or "edit"
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [userOptions, setUserOptions] = useState([]);
    const [userLoading, setUserLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    // Validation Schema
    const SubscriptionSchema = Yup.object().shape({
        stripe_subscription_id: Yup.string().required("Stripe Subscription ID is required"),
        name: Yup.string().required("Name is required"),
        country: Yup.string().required("Country is required"),
        user: Yup.object().required("User is required"),
        recurring_date: Yup.date().required("Recurring Date is required"),
        start_date: Yup.date().required("Start Date is required"),
        status: Yup.string().required("Status is required"),
        span: Yup.string().required("Span is required"),
        amount: Yup.number().required("Amount is required").positive("Amount must be positive"),
        provider: Yup.string().required("Provider is required")
    });

    useEffect(() => {
        fetchSubscriptions(page, rowsPerPage);
    }, [page, rowsPerPage]);

    const fetchSubscriptions = async (pageNum = 0, pageSize = 10) => {
        try {
            setLoading(true);
            const response = await api.get(`/subscriptions?page=${pageNum + 1}&page_size=${pageSize}`);
            setSubscriptions(response.data.data);
            setTotal(response.data.pagination?.totalItems || 0);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
            setSnackbar({ open: true, message: "Failed to fetch subscriptions", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleUserSearch = async (event, value) => {
        if (!value) {
            setUserOptions([]);
            return;
        }
        try {
            setUserLoading(true);
            const response = await api.get(`/users?search=${value}&page_size=5`);
            setUserOptions(response.data.data);
        } catch (error) {
            console.error("Error searching users:", error);
        } finally {
            setUserLoading(false);
        }
    };

    const handleAddSubscription = () => {
        setDialogMode("add");
        setEditingSubscription(null);
        setOpenDialog(true);
    };

    const handleEditSubscription = (subscription) => {
        setDialogMode("edit");
        setEditingSubscription(subscription);
        // Pre-populate user options with the current user so it displays correctly
        if (subscription.user) {
            setUserOptions([subscription.user]);
        }
        setOpenDialog(true);
    };

    const handleDeleteSubscription = async (id) => {
        if (window.confirm("Are you sure you want to delete this subscription?")) {
            try {
                await api.delete(`/subscriptions/${id}`);
                setSnackbar({ open: true, message: "Subscription deleted successfully", severity: "success" });
                fetchSubscriptions(page, rowsPerPage);
            } catch (error) {
                console.error("Error deleting subscription:", error);
                setSnackbar({ open: true, message: "Failed to delete subscription", severity: "error" });
            }
        }
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const payload = {
                ...values,
                user_id: values.user.id,
                // Ensure dates are just dates if format requires, but standard ISO usually works with Sequelize DATE
            };

            if (dialogMode === "add") {
                await api.post("/subscriptions", payload);
                setSnackbar({ open: true, message: "Subscription created successfully", severity: "success" });
            } else {
                await api.put(`/subscriptions/${editingSubscription.id}`, payload);
                setSnackbar({ open: true, message: "Subscription updated successfully", severity: "success" });
            }
            setOpenDialog(false);
            fetchSubscriptions(page, rowsPerPage);
        } catch (error) {
            console.error("Error saving subscription:", error);
            setSnackbar({ open: true, message: "Failed to save subscription", severity: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box>
            <Header
                title="Subscriptions"
                action={
                    <Button variant="contained" startIcon={<Add />} onClick={handleAddSubscription}>
                        Add Subscription
                    </Button>
                }
            />

            <CommonTable
                columns={[
                    { name: "id", label: "ID" },
                    { name: "stripe_subscription_id", label: "Stripe ID" },
                    { name: "name", label: "Name" },
                    {
                        name: "status",
                        label: "Status",
                        render: (row) => (
                            <Typography sx={{
                                color: row.status === 'active' ? 'green' : row.status === 'cancelled' ? 'red' : 'orange',
                                textTransform: 'capitalize'
                            }}>
                                {row.status}
                            </Typography>
                        )
                    },
                    {
                        name: "start_date",
                        label: "Start Date",
                        render: (row) => dayjs(row.start_date).format('YYYY-MM-DD')
                    },
                    {
                        name: "recurring_date",
                        label: "Recurring Date",
                        render: (row) => dayjs(row.recurring_date).format('YYYY-MM-DD')
                    },
                    { name: "span", label: "Span" },
                    {
                        name: "amount",
                        label: "Amount",
                        render: (row) => row.amount ? `$${row.amount}` : 'N/A'
                    },
                    { name: "provider", label: "Provider" },
                    {
                        name: "user",
                        label: "User",
                        render: (row) => row.user ? `${row.user.first_name} ${row.user.last_name}` : 'N/A'
                    },
                ]}
                data={subscriptions}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                loading={loading}
                onPageChange={setPage}
                onRowsPerPageChange={(e) => setRowsPerPage(e?.target.value)}
                actions={(row) => (
                    <Box display="flex" gap={1}>
                        <IconButton onClick={() => handleEditSubscription(row)} size="small" sx={{ color: '#ff9800' }}>
                            <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteSubscription(row.id)} size="small" sx={{ color: '#f44336' }}>
                            <Delete />
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
                        p: 3,
                    },
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', color: '#3322FF', fontWeight: 800, pb: 4 }}>
                    {dialogMode === "add" ? "Add Subscription" : "Edit Subscription"}
                </DialogTitle>

                <Formik
                    initialValues={{
                        stripe_subscription_id: editingSubscription?.stripe_subscription_id || "",
                        name: editingSubscription?.name || "",
                        country: editingSubscription?.country || "",
                        user: editingSubscription?.user || null,
                        recurring_date: editingSubscription?.recurring_date ? dayjs(editingSubscription.recurring_date).format('YYYY-MM-DD') : "",
                        start_date: editingSubscription?.start_date ? dayjs(editingSubscription.start_date).format('YYYY-MM-DD') : "",
                        end_date: editingSubscription?.end_date ? dayjs(editingSubscription.end_date).format('YYYY-MM-DD') : "",
                        status: editingSubscription?.status || "active",
                        span: editingSubscription?.span || "Monthly",
                        amount: editingSubscription?.amount || "",
                        provider: editingSubscription?.provider || "Inexa/edx",
                    }}
                    validationSchema={SubscriptionSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
                        <Form>
                            <Grid container spacing={2}>
                                { /* User Search - Auto-populates Name and Country */}
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={userOptions}
                                        loading={userLoading}
                                        getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                        onInputChange={(event, newInputValue) => {
                                            handleUserSearch(event, newInputValue);
                                        }}
                                        onChange={(event, newValue) => {
                                            setFieldValue("user", newValue);
                                            if (newValue) {
                                                setFieldValue("name", `${newValue.first_name} ${newValue.last_name}`);
                                                setFieldValue("country", newValue.country || "");
                                            }
                                        }}
                                        value={values.user}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Search User (Name, Email, Country)"
                                                variant="outlined"
                                                error={touched.user && Boolean(errors.user)}
                                                helperText={touched.user && errors.user}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {userLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={6}>
                                    <Field
                                        as={TextField}
                                        name="name"
                                        label="Name"
                                        fullWidth
                                        variant="outlined"
                                        value={values.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.name && Boolean(errors.name)}
                                        helperText={touched.name && errors.name}
                                        disabled // Auto-populated from user
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Field
                                        as={TextField}
                                        name="country"
                                        label="Country"
                                        fullWidth
                                        variant="outlined"
                                        value={values.country}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.country && Boolean(errors.country)}
                                        helperText={touched.country && errors.country}
                                        disabled // Auto-populated from user
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Field
                                        as={TextField}
                                        name="stripe_subscription_id"
                                        label="Stripe Subscription ID"
                                        fullWidth
                                        variant="outlined"
                                        value={values.stripe_subscription_id}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.stripe_subscription_id && Boolean(errors.stripe_subscription_id)}
                                        helperText={touched.stripe_subscription_id && errors.stripe_subscription_id}
                                    />
                                </Grid>

                                <Grid item xs={6}>
                                    <Field
                                        as={TextField}
                                        name="start_date"
                                        label="Start Date"
                                        type="date"
                                        fullWidth
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        value={values.start_date}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.start_date && Boolean(errors.start_date)}
                                        helperText={touched.start_date && errors.start_date}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Field
                                        as={TextField}
                                        name="recurring_date"
                                        label="Recurring Date"
                                        type="date"
                                        fullWidth
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        value={values.recurring_date}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.recurring_date && Boolean(errors.recurring_date)}
                                        helperText={touched.recurring_date && errors.recurring_date}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Field
                                        as={TextField}
                                        name="end_date"
                                        label="End Date"
                                        type="date"
                                        fullWidth
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        value={values.end_date}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.end_date && Boolean(errors.end_date)}
                                        helperText={touched.end_date && errors.end_date}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Status</InputLabel>
                                        <Field
                                            as={Select}
                                            name="status"
                                            label="Status"
                                            value={values.status}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.status && Boolean(errors.status)}
                                        >
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                            <MenuItem value="past_due">Past Due</MenuItem>
                                            <MenuItem value="trialing">Trialing</MenuItem>
                                        </Field>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Span</InputLabel>
                                        <Field
                                            as={Select}
                                            name="span"
                                            label="Span"
                                            value={values.span}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.span && Boolean(errors.span)}
                                        >
                                            <MenuItem value="Monthly">Monthly</MenuItem>
                                            <MenuItem value="Quarterly">Quarterly</MenuItem>
                                            <MenuItem value="Yearly">Yearly</MenuItem>
                                        </Field>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Field
                                        as={TextField}
                                        name="amount"
                                        label="Amount"
                                        type="number"
                                        fullWidth
                                        variant="outlined"
                                        value={values.amount}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        error={touched.amount && Boolean(errors.amount)}
                                        helperText={touched.amount && errors.amount}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    $
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Provider</InputLabel>
                                        <Field
                                            as={Select}
                                            name="provider"
                                            label="Provider"
                                            value={values.provider}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={touched.provider && Boolean(errors.provider)}
                                        >
                                            <MenuItem value="Inexa/edx">Inexa/edx</MenuItem>
                                            <MenuItem value="UpGrad">UpGrad</MenuItem>
                                        </Field>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <DialogActions sx={{ justifyContent: "center", mt: 3 }}>
                                <Button
                                    onClick={() => setOpenDialog(false)}
                                    variant="outlined"
                                    disabled={isSubmitting}
                                    sx={{
                                        borderColor: "#3322FF",
                                        color: "#3322FF",
                                        fontWeight: 700,
                                        borderRadius: 3,
                                        px: 3,
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
                                        "&:hover": { background: "#2211AA" }
                                    }}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (dialogMode === "add" ? "Add Subscription" : "Update Subscription")}
                                </Button>
                            </DialogActions>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Subscriptions;
