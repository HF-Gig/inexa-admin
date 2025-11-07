import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography, CircularProgress, Avatar, Snackbar, Alert, FormHelperText } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { Formik, Form } from "formik";
import CommonTextField from "../../components/CommonTextField";
import api from "../../helpers/api";
import * as Yup from "yup";

const OrganizationForm = ({ mode = "add" }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [initial, setInitial] = useState({
        name: "",
        certificate_logo_image_url: null,
    });
    const [loading, setLoading] = useState(mode !== "add");
    const [imagePreview, setImagePreview] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if ((mode === "edit" || mode === "view") && id) {
            setLoading(true);
            api.get(`/owners/${id}`).then(res => {
                const data = res.data.data || {};
                setInitial({
                    name: data.name || "",
                    certificate_logo_image_url: data.certificate_logo_image_url || null,
                });
                setImagePreview(data.certificate_logo_image_url || null);
                setLoading(false);
            });
        }
    }, [mode, id]);

    if (loading) return <CircularProgress />;

    const OrganizationSchema = Yup.object().shape({
        name: Yup.string().trim().min(2, "Organization name must be at least 2 characters")
            .max(50, "Organization name must be at most 50 characters").required("Organization name is required"),
        certificate_logo_image_url: Yup.mixed().required("Organization logo is required"),
    });
    return (
        <Box p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4">
                    {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"} University
                </Typography>
                <Box display="flex" gap={1}>
                    {mode === 'view' && id && (
                        <Button variant="contained" color="primary" onClick={() => navigate(`/organization/edit/${id}`)}>Edit</Button>
                    )}
                    <Button variant="contained" color="secondary" onClick={() => navigate("/organization")}>Listing</Button>
                </Box>
            </Box>
            <Formik
                initialValues={initial}
                enableReinitialize
                validationSchema={OrganizationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    const formData = new FormData();
                    formData.append('name', values.name);
                    if (values.certificate_logo_image_url && values.certificate_logo_image_url instanceof File) {
                        formData.append('certificate_logo_image_url', values.certificate_logo_image_url);
                    }
                    try {
                        const isAdd = mode === "add";
                        const url = isAdd ? "/owners" : `/owners/${id}`;
                        const method = isAdd ? "post" : "put";

                        const res = await api[method](url, formData);

                        if (res.data.status) {
                            navigate("/organization", {
                                state: {
                                    toast: {
                                        message: `Organization ${isAdd ? "added" : "updated"} successfully!`,
                                        severity: "success",
                                    },
                                },
                            });
                        } else {
                            showToast({
                                message: `Failed to save organization. Please try again.`,
                                severity: "error",
                            });
                        }
                    } catch (e) {
                        showToast({
                            message: `Failed to save organization. Please try again.`,
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
                            <Grid item xs={12} md={6}>
                                <CommonTextField
                                    name="name"
                                    label="University Name"
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
                                            if (mode !== 'view') document.getElementById('org-image-input').click();
                                        }}
                                        onDrop={e => {
                                            e.preventDefault();
                                            if (mode === 'view') return;
                                            const file = e.dataTransfer.files[0];
                                            if (file && file.type.startsWith('image/')) {
                                                setFieldValue("certificate_logo_image_url", file);
                                                const reader = new FileReader();
                                                reader.onload = ev => setImagePreview(ev.target.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        onDragOver={e => e.preventDefault()}
                                    >
                                        <input
                                            id="org-image-input"
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.currentTarget.files[0];
                                                if (file) {
                                                    setFieldValue("certificate_logo_image_url", file);
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
                                                    <b>Drag & drop</b> a logo here, or <span style={{ color: '#222', textDecoration: 'underline' }}>click to select</span>
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#757575' }}>
                                                    (JPG, PNG, or GIF, max 5MB)
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
                                                            setFieldValue("certificate_logo_image_url", null);
                                                            setImagePreview(null);
                                                        }}
                                                    >
                                                        ×
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                        <FormHelperText error={!!(touched.certificate_logo_image_url && errors.certificate_logo_image_url)}>
                                            {touched.certificate_logo_image_url && errors.certificate_logo_image_url}
                                        </FormHelperText>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                {mode !== "view" && (
                                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                                        {mode === "add" ? "Add" : "Update"} Univeristy
                                    </Button>
                                )}
                                <Button variant="outlined" sx={{ ml: 2 }} onClick={() => navigate("/organization")}>Cancel</Button>
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

export default OrganizationForm; 