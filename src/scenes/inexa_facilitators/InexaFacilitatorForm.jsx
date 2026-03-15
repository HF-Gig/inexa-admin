import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography, CircularProgress, Avatar, Snackbar, Alert, FormHelperText } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { Formik, Form } from "formik";
import CommonTextField from "../../components/CommonTextField";
import api from "../../helpers/api";
import * as Yup from "yup";

const InexaFacilitatorForm = ({ mode = "add" }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [initial, setInitial] = useState({
        first_name: "",
        last_name: "",
        subject_expertise: "",
        email: "",
        bio_info: "",
        linkedin: "",
        twitter: "",
        profile_image_url: null,
    });
    const [loading, setLoading] = useState(mode !== "add");
    const [imagePreview, setImagePreview] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if ((mode === "edit" || mode === "view") && id) {
            setLoading(true);
            api.get(`/staff/inexa-staff/${id}`).then(res => {
                const data = res.data.data || {};
                const social_links = typeof data.social_links === 'object' ? data.social_links : JSON.parse(data.social_links || '{}');
                setInitial({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    subject_expertise: data.subject_expertise || "",
                    email: data.email || "",
                    bio_info: data.bio_info || "",
                    linkedin: social_links.linkedin || "",
                    twitter: social_links.twitter || "",
                    youtube: social_links.youtube || "",
                    profile_image_url: data.profile_image_url || null,
                });
                setImagePreview(data.profile_image_url || null);
                setLoading(false);
            }).catch(() => {
                setLoading(false);
            });
        }
    }, [mode, id]);

    if (loading) return <CircularProgress />;

    const FacilitatorSchema = Yup.object().shape({
        first_name: Yup.string().required("First name is required"),
        last_name: Yup.string().required("Last name is required"),
        subject_expertise: Yup.string().required("Subject expertise is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
        bio_info: Yup.string(),
        linkedin: Yup.string().url("Invalid LinkedIn URL"),
        twitter: Yup.string().url("Invalid Twitter URL"),
        youtube: Yup.string().url("Invalid Youtube URL"),
        profile_image_url: Yup.mixed()
            .required("Image is required")
            .test(
                "fileSize",
                "Image must be less than or equal to 5MB",
                value => {
                    if (!value) return false;
                    if (typeof value === "string") return true;
                    if (typeof File !== 'undefined' && value instanceof File) {
                        return value.size <= 5 * 1024 * 1024;
                    }
                    return false;
                }
            ),
    });

    return (
        <Box p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4">
                    {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"} Inexa Facilitator
                </Typography>
                <Box display="flex" gap={1}>
                    {mode === 'view' && id && (
                        <Button variant="contained" color="primary" onClick={() => navigate(`/inexa-staff/edit/${id}`)}>Edit</Button>
                    )}
                    <Button variant="contained" color="secondary" onClick={() => navigate("/inexa-staff")}>Listing</Button>
                </Box>
            </Box>
            <Formik
                initialValues={initial}
                validationSchema={FacilitatorSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                    const formData = new FormData();
                    formData.append('first_name', values.first_name);
                    formData.append('last_name', values.last_name);
                    formData.append('subject_expertise', values.subject_expertise);
                    formData.append('email', values.email);
                    formData.append('bio_info', values.bio_info);
                    const social_links = {};
                    if (values.linkedin) social_links.linkedin = values.linkedin;
                    if (values.twitter) social_links.twitter = values.twitter;
                    if (values.youtube) social_links.youtube = values.youtube;
                    formData.append('social_links', JSON.stringify(social_links));
                    if (values.profile_image_url && values.profile_image_url instanceof File) {
                        formData.append('profile_image_url', values.profile_image_url);
                    }
                    try {
                        const isAdd = mode === "add";
                        const url = isAdd ? "/staff/inexa-staff" : `/staff/inexa-staff/${id}`;
                        const method = isAdd ? api.post : api.put; // ✅ POST for add, PUT for edit

                        const res = await method(url, formData);

                        if (res.status === 200 || res.status === 201) {
                            navigate("/inexa-staff", { 
                                state: { 
                                    toast: { 
                                        message: `Facilitator ${isAdd ? "added" : "updated"} successfully!`, 
                                        severity: "success" 
                                    } 
                                } 
                            });
                        } else {
                            showToast({ 
                                message: `Failed to save facilitator. Please try again.`, 
                                severity: "error" 
                            });
                        }
                    } catch (e) {
                        showToast({ 
                            message: `Failed to save facilitator. Please try again.`, 
                            severity: "error" 
                        });
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({ values, setFieldValue, isSubmitting, touched, errors }) => {
                    return (
                        <Form>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="first_name"
                                        label="First Name"
                                        required
                                        onChange={e => setFieldValue("first_name", e.target.value)}
                                        value={values.first_name}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.first_name && errors.first_name ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.first_name}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="last_name"
                                        label="Last Name"
                                        required
                                        onChange={e => setFieldValue("last_name", e.target.value)}
                                        value={values.last_name}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.last_name && errors.last_name ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.last_name}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="subject_expertise"
                                        label="Subject Expertise"
                                        required
                                        onChange={e => setFieldValue("subject_expertise", e.target.value)}
                                        value={values.subject_expertise}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.subject_expertise && errors.subject_expertise ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.subject_expertise}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="email"
                                        label="Email"
                                        required
                                        onChange={e => setFieldValue("email", e.target.value)}
                                        value={values.email}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.email && errors.email ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.email}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="linkedin"
                                        label="LinkedIn URL"
                                        onChange={e => setFieldValue("linkedin", e.target.value)}
                                        value={values.linkedin}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.linkedin && errors.linkedin ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.linkedin}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="twitter"
                                        label="Twitter URL"
                                        onChange={e => setFieldValue("twitter", e.target.value)}
                                        value={values.twitter}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.twitter && errors.twitter ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.twitter}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="youtube"
                                        label="Youtube URL"
                                        onChange={e => setFieldValue("youtube", e.target.value)}
                                        value={values.youtube}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.youtube && errors.youtube ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.youtube}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <CommonTextField
                                        name="bio_info"
                                        label="Bio Info"
                                        multiline
                                        rows={3}
                                        onChange={e => setFieldValue("bio_info", e.target.value)}
                                        value={values.bio_info}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.bio_info && errors.bio_info ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.bio_info}
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
                                                if (mode !== 'view') document.getElementById('facilitator-image-input').click();
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                if (mode === 'view') return;
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    setFieldValue("profile_image_url", file);
                                                    const reader = new FileReader();
                                                    reader.onload = ev => setImagePreview(ev.target.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            onDragOver={e => e.preventDefault()}
                                        >
                                            <input
                                                id="facilitator-image-input"
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.currentTarget.files[0];
                                                    if (file) {
                                                        setFieldValue("profile_image_url", file);
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
                                                        <b>Drag & drop</b> a photo here, or <span style={{ color: '#222', textDecoration: 'underline' }}>click to select</span>
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
                                                                setFieldValue("profile_image_url", null);
                                                                setImagePreview(null);
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}
                                            <FormHelperText error={!!(touched.profile_image_url && errors.profile_image_url)}>
                                                {touched.profile_image_url && errors.profile_image_url}
                                            </FormHelperText>
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12}>
                                    {mode !== "view" && (
                                        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                                            {mode === "add" ? "Add" : "Update"} Facilitator
                                        </Button>
                                    )}
                                    <Button variant="outlined" sx={{ ml: 2 }} onClick={() => navigate("/inexa-staff")}>Cancel</Button>
                                </Grid>
                            </Grid>
                        </Form>
                    )
                }}
            </Formik>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default InexaFacilitatorForm;
