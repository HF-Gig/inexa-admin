import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography, CircularProgress, Avatar, Snackbar, Alert, FormHelperText, FormControlLabel, Checkbox } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { Formik, Form } from "formik";
import CommonTextField from "../../components/CommonTextField";
import api from "../../helpers/api";
import * as Yup from "yup";

const ProviderForm = ({ mode = "add" }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [initial, setInitial] = useState({
        name: "",
        slug: "",
        image: null,
        status: true,
    });
    const [loading, setLoading] = useState(mode !== "add");
    const [imagePreview, setImagePreview] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if ((mode === "edit" || mode === "view") && id) {
            setLoading(true);
            api.get(`/course-providers/${id}`).then(res => {
                const data = res.data;
                setInitial({
                    name: data.name || "",
                    slug: data.slug || "",
                    image: null, // Keep null for new uploads
                    status: data.status || false,
                });
                setImagePreview(data.logo_url ? `${import.meta.env.VITE_API_URL}${data.logo_url}` : null);
                setLoading(false);
            });
        }
    }, [mode, id]);

    if (loading) return <CircularProgress />;

    const ProviderSchema = Yup.object().shape({
        name: Yup.string().trim().min(2, "Provider name must be at least 2 characters")
            .max(50, "Provider name must be at most 50 characters").required("Provider name is required"),
        slug: Yup.string().trim().min(2, "Slug must be at least 2 characters")
            .max(50, "Slug must be at most 50 characters").required("Slug is required"),
        image: mode === "add" ? Yup.mixed().required("Provider image is required") : Yup.mixed(),
        status: Yup.boolean().required("Status is required"),
    });

    return (
        <Box p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4">
                    {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"} Provider
                </Typography>
                <Box display="flex" gap={1}>
                    {mode === 'view' && id && (
                        <Button variant="contained" color="primary" onClick={() => navigate(`/providers/edit/${id}`)}>Edit</Button>
                    )}
                    <Button variant="contained" color="secondary" onClick={() => navigate("/providers")}>Listing</Button>
                </Box>
            </Box>
            <Formik
                initialValues={initial}
                enableReinitialize
                validationSchema={ProviderSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    const formData = new FormData();
                    formData.append('name', values.name);
                    formData.append('slug', values.slug);
                    formData.append('status', values.status);
                    if (values.image && values.image instanceof File) {
                        formData.append('logo_url', values.image);
                    }
                    try {
                        const url = mode === "add" ? "/course-providers" : `/course-providers/${id}`;
                        const res = mode === "add"
                            ? await api.post(url, formData)
                            : await api.put(url, formData);

                        if (res.data.status) {
                            navigate("/providers", {
                            state: {
                                toast: {
                                message: `Provider ${mode === "add" ? "added" : "updated"} successfully!`,
                                severity: "success",
                                },
                            },
                            });
                        } else {
                            showToast({
                            message: `Failed to save provider. Please try again.`,
                            severity: "error",
                            });
                        }
                        } catch (e) {
                        showToast({
                            message: `Failed to save provider. Please try again.`,
                            severity: "error",
                        });
                        } finally {
                        setSubmitting(false);
                        }
                }}
            >
                {({ values, setFieldValue, isSubmitting, touched, errors }) => (
                    <Form>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <CommonTextField
                                    name="name"
                                    label="Provider Name"
                                    required
                                    onChange={e => setFieldValue("name", e.target.value)}
                                    value={values.name}
                                    disabled={mode === 'view'}
                                    helperText={
                                        touched.name && errors.name ? (
                                            <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                {errors.name}
                                            </span>
                                        ) : null
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <CommonTextField
                                    name="slug"
                                    label="Slug"
                                    required
                                    onChange={e => setFieldValue("slug", e.target.value)}
                                    value={values.slug}
                                    disabled={mode === 'view'}
                                    helperText={
                                        touched.slug && errors.slug ? (
                                            <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                {errors.slug}
                                            </span>
                                        ) : null
                                    }
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={values.status}
                                            onChange={e => setFieldValue("status", e.target.checked)}
                                            disabled={mode === 'view'}
                                        />
                                    }
                                    label="Active Status"
                                />
                            </Grid>
                            <Grid item xs={12} md={12}>
                                {mode === 'view' ? (
                                    imagePreview && (
                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                            <Avatar src={imagePreview} alt="Preview" sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }} />
                                        </Box>
                                    )
                                ) : (
                                    <Box
                                        sx={{
                                            border: '2px dashed #3322FF',
                                            borderRadius: 2,
                                            p: 3,
                                            textAlign: 'center',
                                            position: 'relative',
                                            background: '#eceaff',
                                            transition: 'border-color 0.2s, background 0.2s',
                                            '&:hover': { borderColor: '#3322FF', background: '#d0ccff' },
                                            cursor: mode === 'view' ? 'not-allowed' : 'pointer',
                                            minHeight: 120,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                        onClick={() => {
                                            if (mode !== 'view') document.getElementById('provider-image-input').click();
                                        }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            if (mode === 'view') return;
                                            const file = e.dataTransfer.files[0];
                                            if (file && file.type.startsWith('image/')) {
                                                setFieldValue("image", file);
                                                const reader = new FileReader();
                                                reader.onload = ev => setImagePreview(ev.target.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        onDragOver={e => e.preventDefault()}
                                    >
                                        <input
                                            id="provider-image-input"
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.currentTarget.files[0];
                                                if (file) {
                                                    setFieldValue("image", file);
                                                    const reader = new FileReader();
                                                    reader.onload = ev => setImagePreview(ev.target.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            disabled={mode === 'view'}
                                        />
                                        {!imagePreview ? (
                                            <>
                                                <Typography variant="body1" sx={{ color: '#222', mb: 1 }}>
                                                    <b>Drag & drop</b> an image here, or <span style={{ color: '#222', textDecoration: 'underline' }}>click to select</span>
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#757575' }}>
                                                    (JPG, PNG, or GIF, max 2MB)
                                                </Typography>
                                            </>
                                        ) : (
                                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                <Avatar src={imagePreview} alt="Preview" sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }} />
                                                {mode !== 'view' && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="contained"
                                                        sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, width: 28, height: 28, borderRadius: '50%', p: 0, fontWeight: 'bold', fontSize: 18, lineHeight: 1 }}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setFieldValue("image", null);
                                                            setImagePreview(null);
                                                        }}
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                        <FormHelperText error={!!(touched.image && errors.image)}>
                                            {touched.image && errors.image}
                                        </FormHelperText>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                {mode !== "view" && (
                                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                                        {mode === "add" ? "Add" : "Update"} Provider
                                    </Button>
                                )}
                                <Button variant="outlined" sx={{ ml: 2 }} onClick={() => navigate("/providers")}>Cancel</Button>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ProviderForm;
