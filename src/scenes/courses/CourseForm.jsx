import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography, CircularProgress, FormHelperText, FormControlLabel, Checkbox } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { Formik, Form } from "formik";
import CommonTextField from "../../components/CommonTextField";
import CommonSelect from "../../components/CommonSelect";
import api from "../../helpers/api";
import "react-quill/dist/quill.snow.css";
import CommonAutocomplete from "../../components/CommonAutocomplete";
import { binarySearchAllSubstring } from '../../helpers/binarySearch';
import { useRef } from 'react';
import CommonTextEditor from "../../components/CommonTextEditor";
import { getInitialValues, getValidationSchema } from "../../constants/courseFormSchemas";
import languagesData from "../../assets/languages.json";
import { useSearchParams } from "react-router-dom";

function toSlugUnderscore(str) {
    return str.replace(/\s+/g, '_');
}

const getPrefix = (ownerName) => ``;

const CourseForm = ({ mode = "add", page }) => {
    const { id } = useParams();
    const contentType = window.location.pathname.includes('course') ? 'course' : 'program';
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [filters, setFilters] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initial, setInitial] = useState(getInitialValues(page));
    // console.log('initial :>> ', initial);
    // Add state for each dropdown
    const [subjectInput, setSubjectInput] = useState("");
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [staffInput, setStaffInput] = useState("");
    const [facilitatorInput, setFacilitatorInput] = useState("");
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [filteredFacilitator, setFilteredFacilitator] = useState([]);
    const [skillsInput, setSkillsInput] = useState("");
    const [filteredSkills, setFilteredSkills] = useState([]);
    const [ownerInput, setOwnerInput] = useState('');
    const [filteredOwners, setFilteredOwners] = useState([]);
    const [languageInput, setLanguageInput] = useState("");
    const [filteredLanguages, setFilteredLanguages] = useState([]);
    const [transcriptLanguageInput, setTranscriptLanguageInput] = useState("");
    const [filteredTranscriptLanguages, setFilteredTranscriptLanguages] = useState([]);
    const [providerInput, setProviderInput] = useState("");
    const [filteredProviders, setFilteredProviders] = useState([]);
    const [levelInput, setLevelInput] = useState("");
    const [filteredLevels, setFilteredLevels] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    // Only for programs
    const [courseInput, setCourseInput] = useState("");
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [programTypeInput, setProgramTypeInput] = useState("");
    const [filteredProgramTypes, setFilteredProgramTypes] = useState([]);
    const [searchItems, setSearchItems] = useSearchParams();
    const pageType = searchItems.get('pageType');

    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchFilters = async () => {
            console.log('Fetching filters for page:', page);
            const res = await api.get("/courses/all-filters" + (page === 'program' ? `?type=programs` : ''));
            console.log('Fetched filters:', res.data);
            setFilters(res.data);
        };
        fetchFilters();
    }, [page]);

    useEffect(() => {
                if ((mode === "edit" || mode === "view") && id && filters) {
                    setLoading(true);
                    api.get(`/courses/${id}`).then(res => {
                        const { owner, subjects, transcript_languages, available_languages, staff, facilitator, staff_uuids, efforts, ...data } = res.data.data || {};
                        const ownerObj = owner ? filters?.owners.find(o => o.name === owner.name) : null;
                        const providerObj = data.course_provider_id ? filters?.course_providers?.find(p => p.id === data.course_provider_id) : null;
                        setOwnerInput(ownerObj ? ownerObj.name : '');
                        setProviderInput(providerObj ? providerObj.name : '');
                        const safeData = Object.fromEntries(
                            Object.entries(data).filter(([key]) => key in getInitialValues(page))
                        );
                        // Transform API response to match form structure
                        const transformed = {
                            ...getInitialValues(page),
                            ...safeData,
                            outcome: data.outcome || '',
                            enrollment_count: data.enrollment_count,
                            provider: providerObj,
                            // Map owners to owner object
                            owner: ownerObj,
                            // Map staff to staff (array of UUIDs or IDs)
                            staff: Array.isArray(staff)
                                ? staff.map(s => s.id || s.uuid || s)
                                : [],
                            facilitator: Array.isArray(facilitator)
                                ? facilitator.map(s => s.id || s.uuid || s)
                                : [],
                            // Map subjects to subject (array of IDs)
                            subject: Array.isArray(subjects)
                                ? subjects.map(s => s.id || s)
                                : [],
                            // Map available_languages to languages (array of codes)
                            languages: Array.isArray(available_languages)
                                ? available_languages.map(l => l.label || l)
                                : [],
                            // Map transcript_languages to transcript_languages (array of codes)
                            transcript_languages: Array.isArray(transcript_languages)
                                ? transcript_languages.map(l => l.label || l)
                                : [],
                            course_provider_id: data.course_provider_id || '',
                            min_effort: Number(efforts?.min_effort) || 0,
                            max_effort: Number(efforts?.max_effort) || 0,
                            isCobranding: data.cobranding === 1,
                            // Parse weeks_to_complete into duration_value and duration_unit
                            duration_value: data.weeks_to_complete ? (typeof data.weeks_to_complete === 'string' ? data.weeks_to_complete.split(' ')[0] : data.weeks_to_complete.toString()) : '',
                            duration_unit: data.weeks_to_complete ? (typeof data.weeks_to_complete === 'string' ? (data.weeks_to_complete.split(' ')[1] || 'Weeks') : 'Weeks') : 'Weeks',
                        };
                        // Ensure short_description starts with prefix in a single paragraph
                        const prefix = getPrefix(ownerObj?.name);
                        const normalizeShortDescription = (rawHtml) => {
                            const prefix = getPrefix(ownerObj?.name);
                            const temp = document.createElement('div');
                            temp.innerHTML = rawHtml || '';

                            let html = (temp.innerHTML || '').trim();

                            // Strip previous prefix if it exists (in HTML or plain)
                            const regex = new RegExp(`^<p>\\s*${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
                            html = html.replace(regex, '');
                            html = html.replace(prefix, ''); // backup plain-text removal just in case

                            // Clean up extra tags or whitespace
                            html = html.trim();

                            // Reconstruct a single paragraph, keeping original formatting
                            return `<p>${prefix}${html}</p>`;
                        };


                        transformed.short_description = normalizeShortDescription(data.short_description);
                        setInitial(transformed);
                        // Set image preview if image_url exists
                        if (data.image_url) {
                            setImagePreview(data.image_url);
                        }
                        if (data.org_logo) {
                            setOwnerLogoPreview(data.org_logo);
                        }
                        if (data.provider_logo) {
                            setProviderLogoPreview(data.provider_logo);
                        }
                        setLoading(false);
                    });
                } else {
                    setInitial({ ...getInitialValues(page) });
                    setLoading(false);
                }
            }, [filters, mode, id, page]);

    // Filtering logic for each dropdown
    useEffect(() => {
        if (filters !== null) {
            setFilteredSubjects(
                subjectInput.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.subjects, subjectInput, x => x.title)
            );
            setFilteredStaff(
                staffInput.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.staff, staffInput, x => `${x.given_name} ${x.family_name}`)
            );
            setFilteredFacilitator(
                facilitatorInput.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.facilitator, facilitatorInput, x => `${x.first_name} ${x.last_name}`)
            );
            setFilteredSkills(
                skillsInput.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.skills, skillsInput, x => x)
            );
            setFilteredOwners(
                ownerInput?.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.owners, ownerInput, x => (x.name || ""))
            );
            console.log('Filtered owners:', filteredOwners);
            setFilteredLanguages(
                languageInput.length < 1
                    ? []
                    : binarySearchAllSubstring(Object.entries(languagesData).map(([code, name]) => ({ code, label: name })), languageInput, x => (x.label || ""))
            );
            setFilteredTranscriptLanguages(
                transcriptLanguageInput.length < 1
                    ? []
                    : binarySearchAllSubstring(Object.entries(languagesData).map(([code, name]) => ({ code, label: name })), transcriptLanguageInput, x => (x.label || ""))
            );
            setFilteredProviders(
                providerInput.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.course_providers, providerInput, x => (x.name || ""))
            );
            setFilteredLevels(
                levelInput.length < 1
                    ? []
                    : binarySearchAllSubstring(filters.levels, levelInput, x => (x.name || ""))
            );
            // Only for programs
            setFilteredCourses(
                courseInput.length < 1 && page !== 'program'
                    ? []
                    : binarySearchAllSubstring(filters.courses, courseInput, x => x.title)
            );
            setFilteredProgramTypes(
                page !== 'program'
                    ? []
                    : binarySearchAllSubstring(filters.program_types, programTypeInput, x => x.name)
            );
        }
    }, [filters, subjectInput, staffInput, skillsInput, ownerInput, languageInput, providerInput, levelInput, transcriptLanguageInput, courseInput]);

    if (!filters || loading) return <CircularProgress />;

    const isProgram = page === 'program';
    const navigatePage = isProgram ? '/programs' : '/courses';

    return (
        <Box p={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h4">
                    {mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View"}
                    {isProgram ? " Program" : " Course"}
                </Typography>
                <Box display="flex" gap={1}>
                    {mode === 'view' && id && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`${navigatePage}/edit/${id}`)}
                        >
                            Edit
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => navigate(navigatePage)}
                    >
                        Listing
                    </Button>
                </Box>
            </Box>
            <Formik
                initialValues={initial}
                enableReinitialize
                validationSchema={getValidationSchema(page)}
                onSubmit={async (values, { setSubmitting }) => {
                    const formData = new FormData();
                    // Always set content_type based on URL
                    formData.append('content_type', contentType);

                    // Helper to append array fields
                    const appendArray = (key, arr) => {
                        if (Array.isArray(arr)) {
                            arr.forEach((v, i) => formData.append(`${key}[${i}]`, v));
                        }
                    };

                    // Append array fields
                    appendArray('subjects', values.subject);
                    appendArray('staff', values.staff?.map(Number));
                    if (Array.isArray(values.facilitator) && values.facilitator.length > 0) {
                        appendArray('facilitator', values.facilitator.map(f => 
                            typeof f === 'object' ? f.id || f.value : Number(f)
                        ));
                        } else {
                        formData.append('facilitator', ''); // or `null` — depends on backend
                    }
                    if (Array.isArray(values.languages) && values.languages.length > 0) {
                        const langs = Array.isArray(values.languages)
                        ? values.languages.map(l => languagesData[l] || l)
                        : [];
                        // console.log("🧩 Raw languages before mapping:", values.languages);
                        // console.log("🧠 languagesData sample:", Object.entries(languagesData).slice(0, 5)); // just to confirm structure
                        // console.log("🧠 languagesData check:", languagesData ? Object.keys(languagesData).length : "undefined");
                        // console.log("✅ Mapped langs (to be sent):", langs);
                        // Append full names
                        appendArray('available_languages', langs);
                    } else {
                        formData.append('available_languages[]', '');
                    }
                    appendArray('transcript_languages', values.transcript_languages);

                    // Append single fields
                    if (values.owner) formData.append('owners[0]', values.owner.id);
                    if (values.image_url) formData.append('image_url', values.image_url);
                    if (values.enrollment_count !== null && values.enrollment_count !== undefined) {
                        formData.append('enrollment_count', values.enrollment_count)
                    }else{
                        formData.append('enrollment_count', null);
                    }
                    if (values.provider) formData.append('course_provider_id', values.provider.id);
                    if (values.duration_value && values.duration_unit) {
                        formData.append('weeks_to_complete', `${values.duration_value} ${values.duration_unit}`);
                    }

                    formData.append('cobranding', values.isCobranding ? 1 : 0);
                    formData.append('breakdown_description', values.breakdown_description);

                    if (values?.order || values?.order !== null) {
                        formData.append('order', values.order);
                    }else{
                        formData.append('order', 0);
                    }
                    // Append all other fields that are not handled above
                    const skipFields = [
                        'subject', 'order', 'owner', 'image_url', 'staff', 'facilitator', 'enrollment_count', 'weeks_to_complete', 'languages', 'course_provider_id', 'efforts', 'transcript_languages', 'breakdown_description'
                    ];
                    Object.entries(values).forEach(([key, value]) => {
                        if (skipFields.includes(key)) return;
                        if (key === "pacing_type" && value) {
                            formData.append("pacing_type", value.replace(/\s+/g, "_"));
                        } else if (Array.isArray(value)) {
                            value.forEach((v, i) => formData.append(`${key}[${i}]`, v));
                        } else if (value instanceof File) {
                            formData.append(key, value);
                        } else {
                            formData.append(key, value);
                        }
                    });
                    try {
                        const url = mode === "add" ? "/courses" : `/courses/${id}`;
                        const res = await api.post(url, formData);
                        // Debug: log the response for verification
                        console.log('Course save response:', res, res?.data);
                        if (res.status === 200) {
                            navigate(navigatePage, { state: { toast: { message: `${isProgram ? "Program" : "Course"} ${mode === "add" ? "added" : "updated"} successfully!`, severity: "success" } } });
                        } else {
                            showToast({ message: `Failed to save ${isProgram ? "program" : "course"}. Please try again.`, severity: "error" });
                        }
                    } catch (e) {
                        showToast({ message: `Failed to save ${isProgram ? "program" : "course"}. Please try again.`, severity: "error" });
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({ values, setFieldValue, isSubmitting, errors, touched }) => {
                    console.log('errors :>> ', errors);
                    React.useEffect(() => {
                        if (!values.isCobranding) {
                            setFieldValue('owner', '');
                            setOwnerInput('');
                        }
                    }, [values.isCobranding, setFieldValue]);
                    return (
                        <Form>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="title"
                                        label="Title"
                                        onChange={e => setFieldValue("title", e.target.value)}
                                        error={touched.title && Boolean(errors.title)}
                                        helperText={touched.title && errors.title}
                                        value={values.title}
                                        disabled={mode === 'view'}
                                        required={true}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="key"
                                        label="Slug"
                                        onChange={e => setFieldValue("key", toSlugUnderscore(e.target.value))}
                                        error={touched.key && Boolean(errors.key)}
                                        helperText={touched.key && errors.key}
                                        value={values.key}
                                        disabled={mode === 'view'}
                                        required={true}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={values.isCobranding}
                                                onChange={async (e) => {
                                                    setFieldValue('isCobranding', e.target.checked);
                                                    if (mode === 'edit') {
                                                        try {
                                                            await api.put(`/courses/${id}/cobranding`, { cobranding: e.target.checked ? 1 : 0 });
                                                            showToast({ message: 'Cobranding updated successfully', severity: 'success' });
                                                        } catch (error) {
                                                            showToast({ message: 'Failed to update cobranding', severity: 'error' });
                                                            // Revert the change on error
                                                            setFieldValue('isCobranding', !e.target.checked);
                                                        }
                                                    }
                                                }}
                                                disabled={mode === 'view'}
                                            />
                                        }
                                        label="Cobranding"
                                    />
                                </Grid>

                                {/* Removed Owner Logo upload section as per user request */}

                                {values.isCobranding && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <CommonAutocomplete
                                                name="owner"
                                                label="University"
                                                required
                                                value={values.owner}
                                                onChange={(val) => {
                                                    console.log('owner onChange val:', val?.name);
                                                    setFieldValue("owner", val);
                                                    setOwnerInput(val?.name || "");
                                                    if (val && !values.short_description) {
                                                    setFieldValue("short_description", `This course is offered by ${val.name}, an edX partner.`);
                                                    }
                                                }}
                                                options={filteredOwners.map(o => ({ value: o, label: o.name }))}
                                                allOptions={filters.owners.map(o => ({ value: o, label: o.name }))}
                                                onOpen={() => console.log('Dropdown opened, allOptions:', filters.owners)}
                                                error={touched.owner && Boolean(errors.owner)}
                                                helperText={touched.owner && errors.owner}
                                                inputValue={ownerInput}
                                                onInputChange={(e, val, reason) => {
                                                    if (reason === 'input') setOwnerInput(val);
                                                    if (reason === 'clear') setOwnerInput('');
                                                }}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                        {/* Removed Provider Logo upload section as per user request */}
                                    </>
                                )}

                                <Grid item xs={12} md={6}>
                                    <CommonAutocomplete
                                        name="provider"
                                        label="Provider"
                                        required={false}
                                        value={values.provider}
                                        onChange={(val) => {
                                            console.log('provider onChange val:', val);
                                            setFieldValue("provider", val);
                                            setProviderInput(val?.name || "");
                                        }}
                                        options={filteredProviders.map(p => ({ value: p, label: p.name }))}
                                        allOptions={filters?.course_providers?.map(p => ({ value: p, label: p.name }))}
                                        error={touched.provider && Boolean(errors.provider)}
                                        helperText={touched.provider && errors.provider}
                                        inputValue={providerInput}
                                        onInputChange={(e, val, reason) => {
                                            if (reason === 'input') setProviderInput(val);
                                            if (reason === 'clear') setProviderInput('');
                                        }}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={12}>
                                    <CommonAutocomplete
                                        name="subject"
                                        label="Subjects"
                                        value={values.subject || []}
                                        onChange={(val) => {
                                        setFieldValue("subject", val);
                                        setSubjectInput("");
                                        }}
                                        options={filteredSubjects.map((s) => ({ value: s.id, label: s.title }))}
                                        allOptions={filters.subjects.map((s) => ({ value: s.id, label: s.title }))}
                                        error={touched.subject && Boolean(errors.subject)}
                                        helperText={touched.subject && errors.subject}
                                        inputValue={subjectInput}
                                        onInputChange={(e, val, reason) => {
                                        if (reason === "input") {
                                            if (val.includes(",")) {
                                            const parts = val.split(",");
                                            const subjectToAdd = parts[0].trim();
                                            if (subjectToAdd) {
                                                const currentSubjects = values.subject || [];
                                                const alreadyExists = currentSubjects.some(
                                                (subj) =>
                                                    subj?.toString().toLowerCase() ===
                                                    subjectToAdd.toLowerCase()
                                                );
                                                if (!alreadyExists) {
                                                setFieldValue("subject", [...currentSubjects, subjectToAdd]);
                                                }
                                            }
                                            const remaining = parts.slice(1).join(",").trim();
                                            setSubjectInput(remaining);
                                            } else {
                                            setSubjectInput(val);
                                            }
                                        }
                                        }}
                                        multiple={true}
                                        disabled={mode === "view"}
                                        allowAdd={true}
                                        externalFilter={true}
                                        onClearInput={() => setSubjectInput("")}
                                    />
                                </Grid>
                                    <>
                                        <Grid item xs={12} md={12}>
                                            <CommonAutocomplete
                                                name="staff"
                                                label="Instructors"
                                                required
                                                value={values.staff || []}
                                                onChange={val => {
                                                    setFieldValue("staff", val);
                                                    setStaffInput('');
                                                }}
                                                options={
                                                staffInput.length > 0
                                                    ? binarySearchAllSubstring(filters.staff, staffInput, x => `${x.given_name} ${x.family_name}`)
                                                        .map(s => ({ value: s.id, label: `${s.given_name} ${s.family_name}` }))
                                                    : []
                                                }
                                                allOptions={filters.staff.map(s => ({ value: s.id, label: s.given_name + ' ' + s.family_name }))}
                                                error={touched.staff && Boolean(errors.staff)}
                                                helperText={touched.staff && errors.staff}
                                                inputValue={staffInput}
                                                onInputChange={(e, val, reason) => {
                                                    if (reason === 'input') setStaffInput(val);
                                                }}
                                                multiple={true}
                                                disabled={mode === 'view'}
                                                externalFilter={true}
                                                onClearInput={() => setStaffInput('')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={12}>
                                            <CommonAutocomplete
                                                name="facilitator"
                                                label="Facilitators"
                                                required
                                                value={values.facilitator || []}
                                                onChange={val => {
                                                    setFieldValue("facilitator", val);
                                                    setFacilitatorInput('');
                                                }}
                                                options={
                                                    facilitatorInput?.length > 0 && Array.isArray(filters?.facilitator)
                                                    ? binarySearchAllSubstring(
                                                        filters.facilitator || [],
                                                        facilitatorInput,
                                                        x => `${x.first_name} ${x.last_name}`
                                                    ).map(s => ({
                                                        value: s.id,
                                                        label: `${s.first_name} ${s.last_name}`
                                                    }))
                                                    : []
                                                }
                                                allOptions={filters.facilitator?.map(s => ({
                                                    value: s.id,
                                                    label: `${s.first_name} ${s.last_name}`
                                                }))}
                                                error={touched.facilitator && Boolean(errors.facilitator)}
                                                helperText={touched.facilitator && errors.facilitator}
                                                inputValue={facilitatorInput}
                                                onInputChange={(e, val, reason) => {
                                                if (reason === 'input') setFacilitatorInput(val);
                                                }}
                                                multiple={true}
                                                disabled={mode === 'view'}
                                                externalFilter={true}
                                                onClearInput={() => setFacilitatorInput('')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={12}>
                                            <CommonAutocomplete
                                                name="skills"
                                                label="Skills"
                                                required
                                                value={values.skills || []}
                                                onChange={val => {
                                                    setFieldValue("skills", val);
                                                    setSkillsInput('');
                                                }}
                                                options={filteredSkills.map(s => ({ value: s, label: s }))}
                                                allOptions={filters.skills.map(s => ({ value: s, label: s }))}
                                                error={touched.skills && Boolean(errors.skills)}
                                                helperText={touched.skills && errors.skills}
                                                inputValue={skillsInput}
                                                onInputChange={(e, val, reason) => {
                                                    if (reason === 'input') {
                                                        if (val.includes(',')) {
                                                            const parts = val.split(',');
                                                            const skillToAdd = parts[0].trim();
                                                            if (skillToAdd) {
                                                                const currentSkills = values.skills || [];
                                                                if (!currentSkills.includes(skillToAdd)) {
                                                                    setFieldValue("skills", [...currentSkills, skillToAdd]);
                                                                }
                                                            }
                                                            const remaining = parts.slice(1).join(',').trim();
                                                            setSkillsInput(remaining);
                                                        } else {
                                                            setSkillsInput(val);
                                                        }
                                                    }
                                                }}
                                                multiple={true}
                                                disabled={mode === 'view'}
                                                allowAdd={true}
                                                externalFilter={true}
                                                onClearInput={() => setSkillsInput('')}
                                            />
                                        </Grid>
                                    </>
                                <Grid item xs={12} md={6} sx={{ color: 'text.primary' }}>
                                    <CommonAutocomplete
                                        name="languages"
                                        label="Language"
                                        required
                                        value={values.languages}
                                        onChange={val => {
                                            const langValues = Array.isArray(val)
                                                ? val.map(v => (typeof v === 'object' ? v.label : v))
                                                : [];
                                            setFieldValue("languages", langValues);
                                        }}
                                        options={filteredLanguages.map(l => ({
                                        value: l.code,
                                        label: l.label
                                        }))}
                                        allOptions={Object.entries(languagesData).map(([code, name]) => ({
                                        value: code,
                                        label: name
                                        }))}
                                        error={touched.languages && Boolean(errors.languages)}
                                        helperText={touched.languages && errors.languages}
                                        inputValue={languageInput}
                                        onInputChange={(e, val, reason) => {
                                        if (reason === 'input') {
                                            // Split by commas while typing
                                            if (val.includes(',')) {
                                            const parts = val
                                                .split(',')
                                                .map(v => v.trim())
                                                .filter(Boolean);

                                            if (parts.length > 0) {
                                                const uniqueLangs = Array.from(
                                                new Set([...(values.languages || []), ...parts])
                                                );
                                                setFieldValue("languages", uniqueLangs);
                                            }

                                            // Clear input after adding
                                            setLanguageInput('');
                                            } else {
                                            setLanguageInput(val);
                                            }
                                        }
                                        }}
                                        multiple={true}
                                        disabled={mode === 'view'}
                                        allowAdd={true}
                                        onClearInput={() => setLanguageInput('')}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonAutocomplete
                                        name="transcript_languages"
                                        label="Transcript Languages"
                                        required
                                        value={values.transcript_languages}
                                        onChange={val => {
                                            setFieldValue("transcript_languages", val);
                                            setTranscriptLanguageInput('');
                                        }}
                                        options={filteredTranscriptLanguages.map(l => ({ value: l.code, label: l.label }))}
                                        allOptions={Object.entries(languagesData).map(([code, name]) => ({ value: code, label: name }))}
                                        error={touched.transcript_languages && Boolean(errors.transcript_languages)}
                                        helperText={touched.transcript_languages && errors.transcript_languages}
                                        multiple={true}
                                        inputValue={transcriptLanguageInput}
                                        onInputChange={(e, val, reason) => {
                                            if (reason === 'input') setTranscriptLanguageInput(val);
                                        }}
                                        disabled={mode === 'view'}
                                        allowAdd={true}
                                        onClearInput={() => setTranscriptLanguageInput('')}
                                    />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                    <CommonTextField
                                        name="duration_value"
                                        label="Duration"
                                        required
                                        type="number"
                                        onChange={e => setFieldValue("duration_value", e.target.value)}
                                        error={touched.duration_value && Boolean(errors.duration_value)}
                                        helperText={touched.duration_value && errors.duration_value}
                                        value={values.duration_value}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <CommonSelect
                                        name="duration_unit"
                                        label="Unit"
                                        required
                                        value={values.duration_unit}
                                        onChange={e => setFieldValue("duration_unit", e.target.value)}
                                        options={[
                                            { value: "Weeks", label: "Weeks" },
                                            { value: "Months", label: "Months" },
                                            { value: "Years", label: "Years" },
                                        ]}
                                        error={touched.duration_unit && Boolean(errors.duration_unit)}
                                        helperText={touched.duration_unit && errors.duration_unit}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonSelect
                                        name="availability"
                                        label="Availability"
                                        required={true}
                                        value={values.availability}
                                        onChange={e => setFieldValue("availability", e.target.value)}
                                        options={[
                                            { value: "archived", label: "Archived" },
                                            { value: "current", label: "Available Now" },
                                            { value: "upcoming", label: "Upcoming" },
                                        ]}
                                        error={touched.availability && Boolean(errors.availability)}
                                        helperText={touched.availability && errors.availability}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonSelect
                                        name="pacing_type"
                                        label="Pacing Type"
                                        value={values.pacing_type}
                                        onChange={e => setFieldValue("pacing_type", e.target.value)}
                                        options={[
                                            { value: "self_paced", label: "Self paced" },
                                            { value: "instructor_paced", label: "Fully intereactive learning" },
                                        ]}
                                        error={touched.pacing_type && Boolean(errors.pacing_type)}
                                        helperText={touched.pacing_type && errors.pacing_type}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                        <CommonTextField
                                            name="start_date"
                                            label="Start Date"
                                            type="date"
                                            required
                                            InputLabelProps={{ shrink: true }}
                                            onChange={e => setFieldValue("start_date", e.target.value)}
                                            error={touched.start_date && Boolean(errors.start_date)}
                                            helperText={touched.start_date && errors.start_date}
                                            value={values.start_date}
                                            defaultValue={values.start_date}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                    {/* <Grid item xs={12} md={4}>
                                        <CommonTextField
                                            name="end_date"
                                            label="End Date" type="date"
                                            InputLabelProps={{ shrink: true }}
                                            onChange={e => setFieldValue("end_date", e.target.value)}
                                            error={touched.end_date && Boolean(errors.end_date)}
                                            helperText={touched.end_date && errors.end_date}
                                            value={values.end_date}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid> */}
                                {!isProgram && (
                                    <>
                                        <Grid item xs={12} md={4}>
                                            <CommonSelect
                                                name="course_level"
                                                label="Course Level"
                                                required
                                                value={values.course_level}
                                                onChange={e => setFieldValue("course_level", e.target.value)}
                                                options={[
                                                    { value: "introductory", label: "Introductory" },
                                                    { value: "intermediate", label: "Intermediate" },
                                                    { value: "advanced", label: "Advanced" },
                                                ]}
                                                error={touched.course_level && Boolean(errors.course_level)}
                                                helperText={touched.course_level && errors.course_level}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                    </>
                                )}
                                <Grid item xs={12}>
                                    <CommonTextEditor
                                        label="Course Overview"
                                        value={values.short_description}
                                        onChange={val => setFieldValue("short_description", !val || val === "null" ? "" : val)}
                                        mode={mode}
                                        required
                                        placeholder="Enter overview..."
                                        error={touched.short_description && errors.short_description}
                                        helperText={touched.short_description && errors.short_description}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <CommonTextEditor
                                        label="Short Description"
                                        value={values.breakdown_description}
                                        onChange={val => setFieldValue("breakdown_description", !val || val === "null" ? "" : val)}
                                        mode={mode}
                                        required
                                        placeholder="Enter description..."
                                        error={touched.breakdown_description && errors.breakdown_description}
                                        helperText={touched.breakdown_description && errors.breakdown_description}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <CommonTextEditor
                                        label="What Students Will Learn"
                                        value={values.outcome === "null" || values.outcome == null ? "" : values.outcome}
                                        onChange={val => setFieldValue("outcome", !val || val === "null" ? "" : val)}
                                        mode={mode}
                                        placeholder="Enter description..."
                                        error={touched.outcome && errors.outcome}
                                        helperText={touched.outcome && errors.outcome}
                                    />
                                </Grid>
                                <Grid item xs={12} md={12}>
                                    {mode === 'view' ? (
                                        imagePreview && (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    style={{
                                                        maxWidth: 220,
                                                        maxHeight: 140,
                                                        borderRadius: 12,
                                                        boxShadow: '0 2px 12px rgba(0, 150, 136, 0.15)',
                                                        marginBottom: 8,
                                                        border: '2px solid #ff9800',
                                                    }}
                                                />
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
                                                minHeight: 180,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            onClick={() => {
                                                if (mode !== 'view') document.getElementById('course-image-input').click();
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                if (mode === 'view') return;
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    setFieldValue("image_url", file);
                                                    const reader = new FileReader();
                                                    reader.onload = ev => setImagePreview(ev.target.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            onDragOver={e => e.preventDefault()}
                                        >
                                            <input
                                                id="course-image-input"
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.currentTarget.files[0];
                                                    if (file) {
                                                        setFieldValue("image_url", file);
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
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        style={{
                                                            maxWidth: 220,
                                                            maxHeight: 140,
                                                            borderRadius: 12,
                                                            boxShadow: '0 2px 12px rgba(0, 150, 136, 0.15)',
                                                            marginBottom: 8,
                                                            border: '2px solid #ff9800',
                                                        }}
                                                    />
                                                    {mode !== 'view' && (
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="contained"
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 8,
                                                                right: 8,
                                                                minWidth: 0,
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: '50%',
                                                                p: 0,
                                                                fontWeight: 'bold',
                                                                fontSize: 18,
                                                                lineHeight: 1,
                                                            }}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setFieldValue("image_url", null);
                                                                setImagePreview(null);
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}
                                            <FormHelperText error={!!(touched.image_url && errors.image_url)}>
                                                {touched.image_url && errors.image_url}
                                            </FormHelperText>
                                        </Box>
                                    )}
                                </Grid>
                                {/* <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="estimated_hours"
                                        label="Estimated Hours"
                                        type="number"
                                        value={values.estimated_hours}
                                        onChange={e => setFieldValue("estimated_hours", e.target.value)}
                                        error={touched.estimated_hours && Boolean(errors.estimated_hours)}
                                        helperText={touched.estimated_hours && errors.estimated_hours}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="pacing_type"
                                        label="Pacing Type"
                                        value={values.pacing_type}
                                        onChange={e => setFieldValue("pacing_type", e.target.value)}
                                        error={touched.pacing_type && Boolean(errors.pacing_type)}
                                        helperText={touched.pacing_type && errors.pacing_type}
                                        disabled={mode === 'view'}
                                    />
                                </Grid> */}
                                {!isProgram && (
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            label="Course Modules"
                                            value={values.course_modules}
                                            onChange={val => setFieldValue("course_modules", !val || val === "null" ? "" : val)}
                                            mode={mode}
                                            placeholder="Enter course modules..."
                                            error={touched.course_modules && errors.course_modules}
                                            helperText={touched.course_modules && errors.course_modules}
                                        />
                                    </Grid>
                                )}
                                <Grid item xs={12} md={4}>
                                    <CommonTextField
                                        name="enrollment_count"
                                        label="Enrollment Count"
                                        type="number"
                                        value={values.enrollment_count}
                                        onChange={e => setFieldValue("enrollment_count", e.target.value)}
                                        error={touched.enrollment_count && Boolean(errors.enrollment_count)}
                                        helperText={errors.enrollment_count}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CommonTextField
                                        name="min_effort"
                                        label="Min Effort"
                                        labelNote="(Hours per week)"
                                        required
                                        type="number"
                                        value={values.min_effort}
                                        onChange={e => setFieldValue("min_effort", e.target.value)}
                                        error={touched.min_effort && Boolean(errors.min_effort)}
                                        helperText={touched.min_effort && errors.min_effort}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <CommonTextField
                                        name="max_effort"
                                        label="Max Effort"
                                        labelNote="(Hours per week)"
                                        required
                                        type="number"
                                        value={values.max_effort}
                                        onChange={e => setFieldValue("max_effort", e.target.value)}
                                        error={touched.max_effort && Boolean(errors.max_effort)}
                                        helperText={touched.max_effort && errors.max_effort}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                {/* Only for courses */}
                                {!isProgram && (
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            label="Prerequisites"
                                            value={values.prerequisites}
                                            onChange={val => setFieldValue("prerequisites", !val || val === "null" ? "" : val)}
                                            mode={mode}
                                            placeholder="Enter prerequisites..."
                                            error={touched.prerequisites && errors.prerequisites}
                                            helperText={touched.prerequisites && errors.prerequisites}
                                        />
                                    </Grid>
                                )}
                                {/* Only for programs */}
                                {isProgram && (
                                    <>
                                        <Grid item xs={12}>
                                            <CommonTextEditor
                                                label="Industry Insights"
                                                value={values.industry_insights}
                                                onChange={val => setFieldValue("industry_insights", !val || val === "null" ? "" : val)}
                                                mode={mode}
                                                placeholder="Enter industry insights..."
                                                error={touched.industry_insights && errors.industry_insights}
                                                helperText={touched.industry_insights && errors.industry_insights}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <CommonAutocomplete
                                                name="courses"
                                                label="Courses List"
                                                value={values.courses || []}
                                                onChange={val => setFieldValue("courses", val)}
                                                options={filteredCourses?.map(c => ({ value: c.id, label: c.title })) || []}
                                                allOptions={filters.courses?.map(c => ({ value: c.id, label: c.title })) || []}
                                                error={touched.courses && Boolean(errors.courses)}
                                                helperText={touched.courses && errors.courses}
                                                inputValue={courseInput}
                                                onInputChange={(e, val, reason) => {
                                                    if (reason === 'input') { setCourseInput(val) }
                                                }}
                                                multiple={true}
                                                disabled={mode === 'view'}
                                                onClearInput={() => setCourseInput('')}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <CommonSelect
                                                name="program_type"
                                                label="Program Type"
                                                value={values.program_type}
                                                onChange={e => setFieldValue("program_type", e.target.value)}
                                                options={filters.program_types?.map(pt => ({ value: pt.id, label: pt.name })) || []}
                                                error={touched.program_type && Boolean(errors.program_type)}
                                                helperText={touched.program_type && errors.program_type}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                    </>
                                )}
                                {/* <Grid item xs={12} md={4}>
                                    <CommonTextField
                                        name="order"
                                        label="Order"
                                        labelNote="(For home page)"
                                        type="number"
                                        value={values.order}
                                        onChange={e => setFieldValue("order", e.target.value)}
                                        error={touched.order && Boolean(errors.order)}
                                        helperText={touched.order && errors.order}
                                        disabled={mode === 'view'}
                                    />
                                </Grid> */}
                                <Grid item xs={12}>
                                    {mode !== "view" && (
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            disabled={isSubmitting}
                                        >
                                            {mode === "add" ? "Add" : "Update"}
                                            {isProgram ? " Program" : " Course"}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outlined"
                                        sx={{ ml: 2 }}
                                        onClick={() => { pageType === "programs" ? navigate("/programs") : navigate("/courses")}}
                                    >
                                        Cancel
                                    </Button>
                                </Grid>
                            </Grid>
                        </Form>
                    );
                }}
            </Formik>
        </Box>
    );
};

export default CourseForm; 