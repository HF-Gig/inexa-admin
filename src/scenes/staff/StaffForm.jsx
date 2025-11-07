import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Grid, Typography, CircularProgress, Avatar, Snackbar, Alert, FormHelperText } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { Formik, Form } from "formik";
import CommonTextField from "../../components/CommonTextField";
import CommonAutocomplete from "../../components/CommonAutocomplete";
import api from "../../helpers/api";
import { binarySearchAllSubstring } from "../../helpers/binarySearch";
import * as Yup from "yup";

// const COUNTRIES = [
//     "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
//     "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
//     "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Cyprus","Czechia",
//     "Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic",
//     "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
//     "Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
//     "Haiti","Honduras","Hungary",
//     "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
//     "Jamaica","Japan","Jordan",
//     "Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
//     "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
//     "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
//     "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
//     "Oman",
//     "Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
//     "Qatar",
//     "Romania","Russia","Rwanda",
//     "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
//     "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
//     "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan",
//     "Vanuatu","Vatican City","Venezuela","Vietnam",
//     "Yemen",
//     "Zambia","Zimbabwe"
// ];

const StaffForm = ({ mode = "add" }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [initial, setInitial] = useState({
        given_name: "",
        family_name: "",
        position_title: "",
        organization_id: "",
        edx_link: "",
        // country: "",
        profile_image_url: null,
    });
    const fetchedOrganizations = useRef(false);
    const [loading, setLoading] = useState(mode !== "add");
    const [imagePreview, setImagePreview] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [organizations, setOrganizations] = useState([]);
    const [orgInput, setOrgInput] = useState("");
    const [filteredOrganizations, setFilteredOrganizations] = useState([]);

    useEffect(() => {
        if (!fetchedOrganizations.current) {
            fetchedOrganizations.current = true;
            api.get("/owners?pagination=false").then(res => {
                console.log("Owners fetched: ", res.data.data)
                setOrganizations(res.data.data || []);
            })
        }
    }, []);

    useEffect(() => {
        if (organizations) {
            setFilteredOrganizations(
                orgInput.length < 1
                    ? []
                    : binarySearchAllSubstring(organizations, orgInput, x => x.name)
            );
        }
    }, [organizations, orgInput]);

    useEffect(() => {
        if ((mode === "edit" || mode === "view") && id && organizations.length) {
            setLoading(true);
            api.get(`/staff/${id}`).then(res => {
                const data = res.data.data || {};
                setInitial({
                    given_name: data.given_name || "",
                    family_name: data.family_name || "",
                    position_title: data.position_title || "",
                    organization_id: data.organization_id || "",
                    edx_link: data.edx_link || "",
                    // country: data.country || "",
                    profile_image_url: data.profile_image_url || null,
                });
                setImagePreview(data.profile_image_url || null);
                // Set orgInput to the organization name for the selected id
                const org = organizations.find(o => o.id === data.organization_id);
                setOrgInput(org ? org.name : "");
                setLoading(false);
            });
        }
    }, [mode, id, organizations]);

    if (loading) return <CircularProgress />;


    const StaffSchema = Yup.object().shape({
        given_name: Yup.string().trim().min(2, "First name must be at least 2 characters")
            .max(30, "First name must be at most 30 characters").required("Given name is required"),
        family_name: Yup.string().trim().min(2, "First name must be at least 2 characters")
            .max(30, "First name must be at most 30 characters").required("Family name is required"),
        position_title: Yup.string().required("Position title is required"),
        organization_id: Yup.string().required("Organization is required"),
        // country: Yup.string().required("Country is required"),
        profile_image_url: Yup.mixed()
            .required("Image is required")
            .test(
                "fileSize",
                "Image must be less than or equal to 2MB",
                value => {
                    if (!value) return false;
                    if (typeof value === "string") return true;
                    if (typeof File !== 'undefined' && value instanceof File) {
                        return value.size <= 2 * 1024 * 1024;
                    }
                    return false;
                }
            ),
    });

    return (
        <Box p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4">
                    {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"} Staff
                </Typography>
                <Box display="flex" gap={1}>
                    {mode === 'view' && id && (
                        <Button variant="contained" color="primary" onClick={() => navigate(`/staff/edit/${id}`)}>Edit</Button>
                    )}
                    <Button variant="contained" color="secondary" onClick={() => navigate("/staff")}>Listing</Button>
                </Box>
            </Box>
            <Formik
                initialValues={initial}
                validationSchema={StaffSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                    const formData = new FormData();
                    formData.append('given_name', values.given_name);
                    formData.append('family_name', values.family_name);
                    formData.append('position_title', values.position_title);
                    formData.append('edx_link', values.edx_link);
                    formData.append('organization_id', values.organization_id);
                    // formData.append('country', values.country);
                    if (values.profile_image_url && values.profile_image_url instanceof File) {
                        formData.append('profile_image_url', values.profile_image_url);
                    }
                    try {
                        const url = mode === "add" ? "/staff" : `/staff/${id}`;
                        const res = await api.post(url, formData);
                        if (res.status === 200 || res.status === 201) {
                            navigate("/staff", { state: { toast: { message: `Staff ${mode === "add" ? "added" : "updated"} successfully!`, severity: "success" } } });
                        } else {
                            showToast({ message: `Failed to save staff. Please try again.`, severity: "error" });
                        }
                    } catch (e) {
                        showToast({ message: `Failed to save staff. Please try again.`, severity: "error" });
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
                                        name="given_name"
                                        label="Given Name"
                                        required
                                        onChange={e => setFieldValue("given_name", e.target.value)}
                                        value={values.given_name}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.given_name && errors.given_name ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.given_name}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="family_name"
                                        label="Family Name"
                                        required
                                        onChange={e => setFieldValue("family_name", e.target.value)}
                                        value={values.family_name}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.family_name && errors.family_name ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.family_name}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="position_title"
                                        label="Position Title"
                                        required
                                        onChange={e => setFieldValue("position_title", e.target.value)}
                                        value={values.position_title}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.position_title && errors.position_title ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.position_title}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="edx_link"
                                        label="edX Link"
                                        required
                                        onChange={e => setFieldValue("edx_link", e.target.value)}
                                        value={values.edx_link}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.edx_link && errors.edx_link ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.edx_link}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonAutocomplete
                                        name="organization_id"
                                        label="Institution"
                                        required
                                        value={values.organization_id}
                                        onChange={val => {
                                            setFieldValue("organization_id", val);
                                            const selected = filteredOrganizations.find(o => o.id === val);
                                            setOrgInput(selected ? selected.name : "");
                                        }}
                                        options={filteredOrganizations.map(o => ({ value: o.id, label: o.name }))}
                                        allOptions={organizations.map(o => ({ value: o.id, label: o.name }))}
                                        inputValue={orgInput}
                                        onInputChange={(e, val, reason) => {
                                            if (reason === 'input') { setOrgInput(val) }
                                        }}
                                        disabled={mode === 'view'}
                                        externalFilter={true}
                                        minChars={3}
                                        helperText={
                                            touched.organization_id && errors.organization_id ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.organization_id}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid>
                                {/* <Grid item xs={12} md={6}>
                                    <CommonAutocomplete
                                        name="country"
                                        label="Country"
                                        required
                                        value={values.country}
                                        onChange={val => setFieldValue("country", val)}
                                        options={COUNTRIES.map(c => ({ value: c, label: c }))}
                                        allOptions={COUNTRIES.map(c => ({ value: c, label: c }))}
                                        inputValue={values.country}
                                        onInputChange={(e, val, reason) => {
                                            if (reason === 'input') setFieldValue("country", val);
                                        }}
                                        disabled={mode === 'view'}
                                        helperText={
                                            touched.country && errors.country ? (
                                                <span style={{ color: "#d32f2f", fontSize: 13, marginTop: 2 }}>
                                                    {errors.country}
                                                </span>
                                            ) : null
                                        }
                                    />
                                </Grid> */}
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
                                                if (mode !== 'view') document.getElementById('staff-image-input').click();
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
                                                id="staff-image-input"
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
                                            {mode === "add" ? "Add" : "Update"} Staff
                                        </Button>
                                    )}
                                    <Button variant="outlined" sx={{ ml: 2 }} onClick={() => navigate("/staff")}>Cancel</Button>
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

export default StaffForm; 