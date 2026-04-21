import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Typography, CircularProgress, FormHelperText, FormControlLabel, Checkbox, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
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
import countries from "../../assets/countries.json";
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
    const [ownerLogoPreview, setOwnerLogoPreview] = useState(null);
    const [providerLogoPreview, setProviderLogoPreview] = useState(null);

    const [imagePreview, setImagePreview] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [newProgramCardBullet, setNewProgramCardBullet] = useState("");
    const [selectedProviderId, setSelectedProviderId] = useState(null);
    const [countryCostRows, setCountryCostRows] = useState([]);
    const [isCountryCostModalOpen, setIsCountryCostModalOpen] = useState(false);
    const [countryCostModalMode, setCountryCostModalMode] = useState("add");
    const [editingCountryCostId, setEditingCountryCostId] = useState(null);
    const [deleteCountryCostRow, setDeleteCountryCostRow] = useState(null);
    const [countryCostForm, setCountryCostForm] = useState({
        countryCode: "DEFAULT",
        selfCost: "",
    });
    const isInexaProvider = Number(selectedProviderId) === 7;

    useEffect(() => {
        const fetchFilters = async () => {
            //console.log('Fetching filters for page:', page);
            const res = await api.get("/courses/all-filters" + (page === 'program' ? `?type=programs` : ''));
            //console.log('Fetched filters:', res.data);
            setFilters(res.data);
        };
        fetchFilters();
    }, [page]);

    useEffect(() => {
        if ((mode === "edit" || mode === "view") && id && filters) {
            setLoading(true);
            api.get(`/courses/${id}`).then(res => {
                const { owner, subjects, transcript_languages, available_languages, staff, facilitator, staff_uuids, skills, efforts, ...data } = res.data.data || {};
                const ownerObj = owner ? filters?.owners.find(o => o.name === owner.name) : null;
                const providerObj = data.course_provider_id ? filters?.course_providers?.find(p => p.id === data.course_provider_id) : null;
                setOwnerInput(ownerObj ? ownerObj.name : '');
                setProviderInput(providerObj ? providerObj.name : '');
                setSelectedProviderId(providerObj?.id || null);
                const safeData = Object.fromEntries(
                    Object.entries(data).filter(([key]) => key in getInitialValues(page))
                );
                // Transform API response to match form structure
                const transformed = {
                    ...getInitialValues(page),
                    ...safeData,
                    outcome: data.outcome || '',
                    enrollment_count: data.enrollment_count,
                    first_payment: data.first_payment || "",
                    quarterly_payment: data.quarterly_payment || "",
                    self_cost: data.self_cost,
                    self_caption: data.self_caption,
                    interactive_cost: data.interactive_cost,
                    interactive_caption: data.interactive_caption,
                    payment_type_self: data.payment_type_self,
                    payment_type_interactive: data.payment_type_interactive,
                    payment_option_once_off: data.payment_option_once_off ?? true,
                    payment_option_thirty_sixty: data.payment_option_thirty_sixty ?? true,
                    payment_option_monthly_11: data.payment_option_monthly_11 ?? true,
                    payment_option_quarterly_3: data.payment_option_quarterly_3 ?? true,
                    payment_first_30_60: data.payment_first_30_60 ?? "",
                    payment_second_30_60: data.payment_second_30_60 ?? "",
                    payment_third_30_60: data.payment_third_30_60 ?? "",
                    payment_first_monthly_11: data.payment_first_monthly_11 ?? "",
                    payment_first_quarterly_3: data.payment_first_quarterly_3 ?? "",
                    program_card_title: (data.program_card_title && data.program_card_title !== "null") ? data.program_card_title : "Inexa's Designed Interactive Learning Experiences",
                    program_card_subtitle: (data.program_card_subtitle && data.program_card_subtitle !== "null") ? data.program_card_subtitle : "Fully interactive learning experiences where you will interact with your peers, Inexa's instructors, and support agents.",
                    program_card_bullets: (data.program_card_bullets && data.program_card_bullets !== "null") ? data.program_card_bullets : "Fully interactive learning experiences.\nSpecialized inexa facilitators.\nImpactful learning journeys.\nCost-effective programs.\nReal-World Practical Application.\nTailored programs for enterprises.",
                    program_card_caption: (data.program_card_caption && data.program_card_caption !== "null") ? data.program_card_caption : (data.interactive_caption && data.interactive_caption !== "null" ? data.interactive_caption : ""),
                    program_card_info_url: (data.program_card_info_url && data.program_card_info_url !== "null") ? data.program_card_info_url : "",

                    card_short: data.card_short,
                    admission_steps: data.admission_steps,
                    admission_steps_desc: data.admission_steps_desc,
                    course_snapshot: data.course_snapshot,
                    key_highlights: data.key_highlights,
                    fee_highlights: data.fee_highlights,
                    degree_detail_short_desc: data.degree_detail_short_desc,
                    cert_and_cred_pathways: data.cert_and_cred_pathways,
                    register_link: data.register_link,
                    provider: providerObj,
                    // Map owners to owner object
                    owner: ownerObj,
                    // Map staff to staff (array of UUIDs or IDs)
                    staff: Array.isArray(staff)
                        ? staff.map(s => s.id || s.uuid || s)
                        : [],
                    skills: Array.isArray(skills)
                        ? skills
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
                        ? available_languages.map(l => l.code || l)
                        : [],
                    // Map transcript_languages to transcript_languages (array of codes)
                    transcript_languages: Array.isArray(transcript_languages)
                        ? transcript_languages.map(l => l.code || l)
                        : [],
                    course_provider_id: data.course_provider_id || '',
                    min_effort: Number(efforts?.min_effort) || 0,
                    max_effort: Number(efforts?.max_effort) || 0,
                    isCobranding: data.cobranding === 1,
                    disclaimer: data.disclaimer === 1,
                    trademark: data.trademark === 0,
                    // Parse weeks_to_complete into duration_value and duration_unit
                    duration_value: data.weeks_to_complete ? (typeof data.weeks_to_complete === 'string' ? data.weeks_to_complete.split(' ')[0] : data.weeks_to_complete.toString()) : '',
                    duration_unit: data.weeks_to_complete ? (typeof data.weeks_to_complete === 'string' ? (data.weeks_to_complete.split(' ')[1] || 'Weeks') : 'Weeks') : 'Weeks',
                };
                const normalizeShortDescription = (rawHtml) => {
                    const prefix = getPrefix(ownerObj?.name);
                    const temp = document.createElement('div');
                    temp.innerHTML = rawHtml || '';

                    let html = (temp.innerHTML || '').trim();

                    const regex = new RegExp(`^<p>\\s*${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
                    html = html.replace(regex, '');
                    html = html.replace(prefix, '');

                    html = html.trim();

                    return `<p>${prefix}${html}</p>`;
                };


                transformed.short_description = normalizeShortDescription(data.short_description);
                transformed.full_description = normalizeShortDescription(data.full_description);
                setInitial(transformed);
                // Set image preview if image_url exists
                if (data.image_url) {
                    setImagePreview(data.image_url);
                }
                if (data.degree_pdf_path) {
                    setPdfPreview(data.degree_pdf_path);
                }
                if (owner?.certificate_logo_image_url) {
                    setOwnerLogoPreview(owner.certificate_logo_image_url);
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

    useEffect(() => {
        const loadCountryCostRows = async () => {
            if (!selectedProviderId || !id || !isInexaProvider) {
                setCountryCostRows([]);
                return;
            }
            try {
                const res = await api.get(`/costs?providerId=${selectedProviderId}&courseId=${id}`);
                setCountryCostRows(res?.data?.data || []);
            } catch (error) {
                showToast({ message: "Failed to load country-wise pricing for selected provider.", severity: "error" });
            }
        };
        loadCountryCostRows();
    }, [selectedProviderId, id, isInexaProvider, showToast]);

    const handleOpenCountryCostModal = () => {
        if (mode === "view") return;
        if (!id) {
            showToast({ message: "Save course first, then add country pricing.", severity: "error" });
            return;
        }
        if (!isInexaProvider) {
            showToast({ message: "Country pricing is available only for Inexa provider.", severity: "error" });
            return;
        }
        setCountryCostModalMode("add");
        setEditingCountryCostId(null);
        setCountryCostForm({
            countryCode: "DEFAULT",
            selfCost: "",
        });
        setIsCountryCostModalOpen(true);
    };

    const handleCloseCountryCostModal = () => {
        setIsCountryCostModalOpen(false);
        setCountryCostModalMode("add");
        setEditingCountryCostId(null);
    };

    const handleCountryCostFormChange = (field, value) => {
        setCountryCostForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveCountryCost = async () => {
        if (countryCostForm.countryCode === "ALL") {
            showToast({ message: "Please select a specific country or Default.", severity: "error" });
            return;
        }

        try {
            if (countryCostModalMode === "edit" && editingCountryCostId) {
                await api.put(`/costs/${editingCountryCostId}`, {
                    providerId: selectedProviderId,
                    courseId: id,
                    countryCode: countryCostForm.countryCode === "DEFAULT" ? "" : countryCostForm.countryCode,
                    selfCost: countryCostForm.selfCost,
                });
            } else {
                await api.post("/costs/update", {
                    providerId: selectedProviderId,
                    courseId: id,
                    countryCode: countryCostForm.countryCode === "DEFAULT" ? "" : countryCostForm.countryCode,
                    selfCost: countryCostForm.selfCost,
                });
            }
            const res = await api.get(`/costs?providerId=${selectedProviderId}&courseId=${id}`);
            setCountryCostRows(res?.data?.data || []);
            setIsCountryCostModalOpen(false);
            setCountryCostModalMode("add");
            setEditingCountryCostId(null);
            showToast({
                message: countryCostModalMode === "edit" ? "Pricing updated successfully." : "Pricing row added successfully.",
                severity: "success"
            });
        } catch (error) {
            showToast({
                message: error?.response?.data?.error || (countryCostModalMode === "edit" ? "Failed to update pricing row." : "Failed to add pricing row."),
                severity: "error"
            });
        }
    };

    const handleEditCountryCost = async (row) => {
        if (mode === "view") return;
        setCountryCostModalMode("edit");
        setEditingCountryCostId(row?.id || null);
        setCountryCostForm({
            countryCode: row?.country_code || "DEFAULT",
            selfCost: row?.self_cost ?? "",
        });
        setIsCountryCostModalOpen(true);
    };

    const handleDeleteCountryCost = async (row) => {
        if (mode === "view") return;
        setDeleteCountryCostRow(row);
    };

    const handleConfirmDeleteCountryCost = async () => {
        if (!deleteCountryCostRow?.id) return;
        try {
            await api.delete(`/costs/${deleteCountryCostRow.id}`);
            const res = await api.get(`/costs?providerId=${selectedProviderId}&courseId=${id}`);
            setCountryCostRows(res?.data?.data || []);
            setDeleteCountryCostRow(null);
            showToast({ message: "Pricing deleted successfully.", severity: "success" });
        } catch (error) {
            showToast({ message: error?.response?.data?.error || "Failed to delete pricing.", severity: "error" });
        }
    };

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
                    ? filters.owners // binarySearchAllSubstring(filters.owners, ownerInput, x => (x.name || ""))
                    : binarySearchAllSubstring(filters.owners, ownerInput, x => (x.name || ""))
            );
            //console.log('Filtered owners:', filteredOwners);
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

                    if (Array.isArray(values.transcript_languages) && values.transcript_languages.length > 0) {
                        const langs = Array.isArray(values.transcript_languages)
                            ? values.transcript_languages.map(l => languagesData[l] || l)
                            : [];
                        // console.log("🧩 Raw languages before mapping:", values.languages);
                        // console.log("🧠 languagesData sample:", Object.entries(languagesData).slice(0, 5)); // just to confirm structure
                        // console.log("🧠 languagesData check:", languagesData ? Object.keys(languagesData).length : "undefined");
                        // console.log("✅ Mapped langs (to be sent):", langs);
                        // Append full names
                        appendArray('transcript_languages', langs);
                    } else {
                        formData.append('transcript_languages[]', '');
                    }

                    // Append single fields
                    if (values.owner) formData.append('owners[0]', values.owner.id);
                    if (values.image_url) formData.append('image_url', values.image_url);
                    if (values.degree_pdf_path) formData.append('degree_pdf_path', values.degree_pdf_path);

                    if (values.enrollment_count !== null && values.enrollment_count !== undefined) {
                        formData.append('enrollment_count', values.enrollment_count)
                    } else {
                        formData.append('enrollment_count', null);
                    }

                    if (values.first_payment !== null && values.first_payment !== undefined && values.first_payment !== "") {
                        formData.append('first_payment', values.first_payment)
                    } else {
                        formData.append('first_payment', "");
                    }

                    if (values.quarterly_payment !== null && values.quarterly_payment !== undefined && values.quarterly_payment !== "") {
                        formData.append('quarterly_payment', values.quarterly_payment)
                    } else {
                        formData.append('quarterly_payment', "");
                    }

                    if (values.self_cost !== null && values.self_cost !== undefined) {
                        formData.append('self_cost', values.self_cost)
                    } else {
                        formData.append('self_cost', "");
                    }
                    if (values.self_caption !== null && values.self_caption !== undefined) {
                        formData.append('self_caption', values.self_caption)
                    } else {
                        formData.append('self_caption', "");
                    }
                    if (values.interactive_cost !== null && values.interactive_cost !== undefined) {
                        formData.append('interactive_cost', values.interactive_cost)
                    } else {
                        formData.append('interactive_cost', "");
                    }
                    if (values.interactive_caption !== null && values.interactive_caption !== undefined) {
                        formData.append('interactive_caption', values.interactive_caption)
                    } else {
                        formData.append('interactive_caption', "");
                    }

                    if (values.card_short !== null && values.card_short !== undefined) {
                        formData.append('card_short', values.card_short)
                    } else {
                        formData.append('card_short', "");
                    }

                    if (values.admission_steps !== null && values.admission_steps !== undefined) {
                        formData.append('admission_steps', values.admission_steps)
                    } else {
                        formData.append('admission_steps', "");
                    }

                    if (values.admission_steps_desc !== null && values.admission_steps_desc !== undefined) {
                        formData.append('admission_steps_desc', values.admission_steps_desc)
                    } else {
                        formData.append('admission_steps_desc', "");
                    }

                    if (values.course_snapshot !== null && values.course_snapshot !== undefined) {
                        formData.append('course_snapshot', values.course_snapshot)
                    } else {
                        formData.append('course_snapshot', "");
                    }

                    if (values.key_highlights !== null && values.key_highlights !== undefined) {
                        formData.append('key_highlights', values.key_highlights)
                    } else {
                        formData.append('key_highlights', "");
                    }

                    if (values.fee_highlights !== null && values.fee_highlights !== undefined) {
                        formData.append('fee_highlights', values.fee_highlights)
                    } else {
                        formData.append('fee_highlights', "");
                    }

                    if (values.cert_and_cred_pathways !== null && values.cert_and_cred_pathways !== undefined) {
                        formData.append('cert_and_cred_pathways', values.cert_and_cred_pathways)
                    } else {
                        formData.append('cert_and_cred_pathways', "");
                    }

                    if (values.degree_detail_short_desc !== null && values.degree_detail_short_desc !== undefined) {
                        formData.append('degree_detail_short_desc', values.degree_detail_short_desc)
                    } else {
                        formData.append('degree_detail_short_desc', "");
                    }

                    if (values.register_link !== null && values.register_link !== undefined) {
                        formData.append('register_link', values.register_link)
                    } else {
                        formData.append('register_link', null);
                    }

                    if (values.provider) formData.append('course_provider_id', values.provider.id);
                    if (values.duration_value && values.duration_unit) {
                        formData.append('weeks_to_complete', `${values.duration_value} ${values.duration_unit}`);
                    }

                    formData.append('cobranding', values.isCobranding ? 1 : 0);
                    console.log("disclaimer value before submit:", values.disclaimer, typeof values.disclaimer);
                    formData.set('disclaimer', values.disclaimer ? 1 : 0);
                    formData.set('trademark', values.trademark ? 0 : 1);
                    formData.append('breakdown_description', values.breakdown_description);

                    if (values?.order || values?.order !== null) {
                        formData.append('order', values.order);
                    } else {
                        formData.append('order', 0);
                    }
                    // Append all other fields that are not handled above
                    const skipFields = [
                        'subject', 'order', 'owner', 'image_url', 'degree_pdf_path', 'staff', 'facilitator', 'enrollment_count', 'first_payment', 'quarterly_payment', 'card_short', 'cert_and_cred_pathways', 'fee_highlights', 'key_highlights', 'course_snapshot', 'admission_steps', 'admission_steps_desc', 'degree_detail_short_desc', 'register_link', 'weeks_to_complete', 'languages', 'course_provider_id', 'efforts', 'transcript_languages', 'breakdown_description', 'self_cost', 'self_caption', 'interactive_cost', 'interactive_caption',
                        // Set explicitly as 0/1 above; skipping avoids a second append as boolean ("true"/"false"), which breaks MySQL SMALLINT for disclaimer/trademark
                        'disclaimer', 'trademark', 'isCobranding',
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
                        console.log("🔥 FORM SUBMISSION STARTED 🔥");
                        // const fd = new FormData();
                        // for (let [key, value] of Object.entries(values)) {
                        //     console.log("➡️ Formik Value:", key, value);

                        //     if (value instanceof File) {
                        //         console.log(`📄 File Detected (${key}):`, {
                        //             name: value.name,
                        //             size: value.size,
                        //             type: value.type
                        //         });
                        //         fd.append(key, value);
                        //     } else {
                        //         fd.append(key, value);
                        //     }
                        // }

                        console.log("📦 REAL FORMDATA CONTENTS:");
                        for (let pair of formData.entries()) {
                            console.log(" →", pair[0], pair[1]);
                        }
                        const url = mode === "add" ? "/courses" : `/courses/${id}`;
                        const res = await api.post(url, formData);
                        // Debug: log the response for verification
                        console.log('Course save response:', res, res?.data);
                        if (res.status === 200 && res.data?.status !== false) {
                            navigate(navigatePage, { state: { toast: { message: `${isProgram ? "Program" : "Course"} ${mode === "add" ? "added" : "updated"} successfully!`, severity: "success" } } });
                        } else {
                            showToast({ message: res.data?.message || `Failed to save ${isProgram ? "program" : "course"}. Please try again.`, severity: "error" });
                        }
                    } catch (e) {
                        const msg = e.response?.data?.message || `Failed to save ${isProgram ? "program" : "course"}. Please try again.`;
                        showToast({ message: msg, severity: "error" });
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({ values, setFieldValue, isSubmitting, errors, touched }) => {
                    // console.log('errors :>> ', errors);
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
                                            setSelectedProviderId(val?.id || null);
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
                                            const langValues = Array.isArray(val)
                                                ? val.map(v => (typeof v === 'object' ? v.label : v))
                                                : [];
                                            setFieldValue("transcript_languages", langValues);
                                            setTranscriptLanguageInput('');
                                        }}
                                        options={filteredTranscriptLanguages.map(l => ({ value: l.code, label: l.label }))}
                                        allOptions={Object.entries(languagesData).map(([code, name]) => ({ value: code, label: name }))}
                                        error={touched.transcript_languages && Boolean(errors.transcript_languages)}
                                        helperText={touched.transcript_languages && errors.transcript_languages}
                                        multiple={true}
                                        inputValue={transcriptLanguageInput}
                                        onInputChange={(e, val, reason) => {
                                            if (reason === 'input') {
                                                if (val.includes(',')) {
                                                    const parts = val
                                                        .split(',')
                                                        .map(v => v.trim())
                                                        .filter(Boolean);

                                                    if (parts.length > 0) {
                                                        const uniqueLangs = Array.from(
                                                            new Set([...(values.transcript_languages || []), ...parts])
                                                        );
                                                        setFieldValue("transcript_languages", uniqueLangs);
                                                    }

                                                    // Clear input after adding
                                                    setTranscriptLanguageInput('');
                                                } else {
                                                    setTranscriptLanguageInput(val);
                                                }
                                            }
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
                                        value={values.full_description}
                                        onChange={val => setFieldValue("full_description", !val || val === "null" ? "" : val)}
                                        mode={mode}
                                        required
                                        placeholder="Enter overview..."
                                        error={touched.full_description && errors.full_description}
                                        helperText={touched.full_description && errors.full_description}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <CommonTextEditor
                                        label="Short Description"
                                        value={values.short_description}
                                        onChange={val => setFieldValue("short_description", !val || val === "null" ? "" : val)}
                                        mode={mode}
                                        required
                                        placeholder="Enter description..."
                                        error={touched.short_description && errors.short_description}
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
                                <Grid item xs={12} md={12}>
                                    {mode === 'view' ? (
                                        pdfPreview && (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    Degree PDF Preview
                                                </Typography>

                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    component="a"
                                                    href={pdfPreview}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    View PDF
                                                </Button>
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
                                                if (mode !== 'view') document.getElementById('degree-pdf-input').click();
                                            }}
                                            onDrop={e => {
                                                e.preventDefault();
                                                if (mode === 'view') return;

                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type === 'application/pdf') {
                                                    setFieldValue("degree_pdf_path", file);
                                                    const reader = new FileReader();
                                                    reader.onload = ev => setPdfPreview(ev.target.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            onDragOver={e => e.preventDefault()}
                                        >
                                            {/* Hidden Input */}
                                            <input
                                                id="degree-pdf-input"
                                                type="file"
                                                hidden
                                                accept="application/pdf"
                                                onChange={e => {
                                                    const file = e.currentTarget.files[0];
                                                    if (file) {
                                                        setFieldValue("degree_pdf_path", file);

                                                        const reader = new FileReader();
                                                        reader.onload = ev => setPdfPreview(ev.target.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                disabled={mode === 'view'}
                                            />

                                            {/* No PDF Yet */}
                                            {!pdfPreview ? (
                                                <>
                                                    <Typography variant="body1" sx={{ color: '#222', mb: 1 }}>
                                                        <b>Drag & drop</b> a PDF here, or{" "}
                                                        <span style={{ color: '#222', textDecoration: 'underline' }}>
                                                            click to select
                                                        </span>
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#757575' }}>
                                                        (PDF only, max 20MB)
                                                    </Typography>
                                                </>
                                            ) : (
                                                /* PDF Uploaded */
                                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                                        PDF Uploaded: {values.degree_pdf_path?.name || 'Degree PDF'}
                                                    </Typography>

                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        component="a"
                                                        href={pdfPreview}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Preview PDF
                                                    </Button>

                                                    {/* Delete PDF */}
                                                    {mode !== 'view' && (
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            variant="contained"
                                                            sx={{
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
                                                                setFieldValue("degree_pdf_path", null);
                                                                setPdfPreview(null);
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}

                                            <FormHelperText error={!!(touched.degree_pdf_path && errors.degree_pdf_path)}>
                                                {touched.degree_pdf_path && errors.degree_pdf_path}
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
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="self_cost"
                                        label="Self Paced Cost"
                                        type="number"
                                        value={values.self_cost}
                                        onChange={e => setFieldValue("self_cost", e.target.value)}
                                        error={touched.self_cost && Boolean(errors.self_cost)}
                                        helperText={errors.self_cost}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="self_caption"
                                        label="Self Caption"
                                        value={values.self_caption}
                                        onChange={e => setFieldValue("self_caption", e.target.value)}
                                        error={touched.self_caption && Boolean(errors.self_caption)}
                                        helperText={errors.self_caption}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="payment_type_self"
                                        label="Self Payment Type"
                                        value={values.payment_type_self}
                                        onChange={e => setFieldValue("payment_type_self", e.target.value)}
                                        error={touched.payment_type_self && Boolean(errors.payment_type_self)}
                                        helperText={errors.payment_type_self}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="interactive_cost"
                                        label="Interactive Cost"
                                        type="number"
                                        value={values.interactive_cost}
                                        onChange={e => setFieldValue("interactive_cost", e.target.value)}
                                        error={touched.interactive_cost && Boolean(errors.interactive_cost)}
                                        helperText={isInexaProvider ? "Interactive cost is not used for Inexa-provided courses." : errors.interactive_cost}
                                        disabled={mode === 'view' || isInexaProvider}
                                    />
                                </Grid>                               
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="interactive_caption"
                                        label="Interactive Caption"
                                        value={values.interactive_caption}
                                        onChange={e => setFieldValue("interactive_caption", e.target.value)}
                                        error={touched.interactive_caption && Boolean(errors.interactive_caption)}
                                        helperText={errors.interactive_caption}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>

                                 <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="annual_discount_percentage"
                                        label="Annual Discount Percentage"
                                        type="number"
                                        value={values.annual_discount_percentage}
                                        onChange={e => setFieldValue("annual_discount_percentage", e.target.value)}
                                        error={touched.annual_discount_percentage && Boolean(errors.annual_discount_percentage)}
                                        helperText={touched.annual_discount_percentage && errors.annual_discount_percentage}
                                        disabled={mode === 'view'}
                                        inputProps={{ min: 0, max: 100 }}
                                    />
                                     {mode !== 'view' && (
                                        <Box mt={1}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="primary"
                                                onClick={async () => {
                                                    if (!values.annual_discount_percentage && values.annual_discount_percentage !== 0) {
                                                        showToast({ message: "Please enter a discount percentage first", severity: "error" });
                                                        return;
                                                    }
                                                    try {
                                                        const res = await api.put('/courses/update-all-discount', {
                                                            annual_discount_percentage: values.annual_discount_percentage
                                                        });
                                                        if (res.data?.status) {
                                                            showToast({ 
                                                                message: res.data.message || "Discount updated for all courses successfully", 
                                                                severity: "success" 
                                                            });
                                                        } else {
                                                            showToast({ message: res.data?.message || "Failed to update discount for all courses", severity: "error" });
                                                        }
                                                    } catch (error) {
                                                        showToast({ 
                                                            message: error?.response?.data?.message || "Error updating discount for all courses", 
                                                            severity: "error" 
                                                        });
                                                    }
                                                }}
                                            >
                                                Apply to All Courses
                                            </Button>
                                        </Box>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <CommonTextField
                                        name="payment_type_interactive"
                                        label="Interactive Payment Type"
                                        value={values.payment_type_interactive}
                                        onChange={e => setFieldValue("payment_type_interactive", e.target.value)}
                                        error={touched.payment_type_interactive && Boolean(errors.payment_type_interactive)}
                                        helperText={errors.payment_type_interactive}
                                        disabled={mode === 'view'}
                                    />
                                </Grid>
                                {isProgram &&
                                    <Grid item xs={12} md={4}>
                                        <CommonTextField
                                            name="price"
                                            label="Price"
                                            value={values.price}
                                            onChange={e => setFieldValue("price", e.target.value)}
                                            error={touched.price && Boolean(errors.price)}
                                            helperText={errors.price}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isInexaProvider && (
                                    <Grid item xs={12}>
                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Add multiple country prices for this selected Inexa course. (Note: Add cost in USD Only)
                                            </Typography>

                                            {mode !== "view" && (
                                                <Box mt={2} display="flex" justifyContent="flex-end">
                                                    <Button
                                                        variant="contained"
                                                        color="secondary"
                                                        onClick={handleOpenCountryCostModal}
                                                        disabled={!id}
                                                    >
                                                        Add Country Price
                                                    </Button>
                                                </Box>
                                            )}
                                            <Box mt={2} sx={{ overflowX: "auto" }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>Country</th>
                                                            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>Self Cost</th>
                                                            {mode !== "view" && (
                                                                <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>Actions</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(countryCostRows || [])
                                                            .map((row) => (
                                                                <tr key={row.id}>
                                                                    <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px" }}>
                                                                        {row.country_code === "DEFAULT" ? "Default (All Countries)" : row.country_code}
                                                                    </td>
                                                                    <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px" }}>{row.self_cost ?? "-"}</td>
                                                                    {mode !== "view" && (
                                                                        <td style={{ borderBottom: "1px solid #f0f0f0", padding: "8px" }}>
                                                                            <Box display="flex" gap={1}>
                                                                                <Button
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    color="secondary"
                                                                                    onClick={() => handleEditCountryCost(row)}
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                                <Button
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    color="error"
                                                                                    onClick={() => handleDeleteCountryCost(row)}
                                                                                >
                                                                                    Delete
                                                                                </Button>
                                                                            </Box>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        </Box>
                                    </Grid>
                                )}
                                         {/* {isInexaProvider && (<>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>Subscription Payment Options</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.payment_option_once_off)}
                                                    onChange={(e) => setFieldValue("payment_option_once_off", e.target.checked)}
                                                    disabled={mode === 'view'}
                                                />
                                            }
                                            label={`Once-off payment of $${values.interactive_cost || 1190}`}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.payment_option_thirty_sixty)}
                                                    onChange={(e) => setFieldValue("payment_option_thirty_sixty", e.target.checked)}
                                                    disabled={mode === 'view'}
                                                />
                                            }
                                            label="First payment, then 2 additional payments (30 and 60 days)"
                                        />
                                    </Grid>
                                    {Boolean(values.payment_option_thirty_sixty) && (
                                        <>
                                            <Grid item xs={12} md={6}>
                                                <CommonTextField
                                                    name="payment_first_30_60"
                                                    label="First payment"
                                                    type="number"
                                                    value={values.payment_first_30_60}
                                                    onChange={e => setFieldValue("payment_first_30_60", e.target.value)}
                                                    error={touched.payment_first_30_60 && Boolean(errors.payment_first_30_60)}
                                                    helperText={touched.payment_first_30_60 && errors.payment_first_30_60}
                                                    disabled={mode === 'view'}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <CommonTextField
                                                    name="payment_second_30_60"
                                                    label="Second and Third amount"
                                                    type="number"
                                                    value={values.payment_second_30_60}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFieldValue("payment_second_30_60", val);
                                                        setFieldValue("payment_third_30_60", val);
                                                    }}
                                                    error={touched.payment_second_30_60 && Boolean(errors.payment_second_30_60)}
                                                    helperText={touched.payment_second_30_60 && errors.payment_second_30_60}
                                                    disabled={mode === 'view'}
                                                />
                                            </Grid>
                                        </>
                                    )}
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.payment_option_monthly_11)}
                                                    onChange={(e) => setFieldValue("payment_option_monthly_11", e.target.checked)}
                                                    disabled={mode === 'view'}
                                                />
                                            }
                                            label="First payment, then monthly payments (11 months)"
                                        />
                                    </Grid>
                                    {Boolean(values.payment_option_monthly_11) && (
                                        <Grid item xs={12} md={6}>
                                            <CommonTextField
                                                name="payment_first_monthly_11"
                                                label="First payment"
                                                type="number"
                                                value={values.payment_first_monthly_11}
                                                onChange={e => setFieldValue("payment_first_monthly_11", e.target.value)}
                                                error={touched.payment_first_monthly_11 && Boolean(errors.payment_first_monthly_11)}
                                                helperText={touched.payment_first_monthly_11 && errors.payment_first_monthly_11}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                    )}
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.payment_option_quarterly_3)}
                                                    onChange={(e) => setFieldValue("payment_option_quarterly_3", e.target.checked)}
                                                    disabled={mode === 'view'}
                                                />
                                            }
                                            label="First payment, then 3 quarterly payments"
                                        />
                                    </Grid>
                                    {Boolean(values.payment_option_quarterly_3) && (
                                        <Grid item xs={12} md={6}>
                                            <CommonTextField
                                                name="payment_first_quarterly_3"
                                                label="First payment"
                                                type="number"
                                                value={values.payment_first_quarterly_3}
                                                onChange={e => setFieldValue("payment_first_quarterly_3", e.target.value)}
                                                error={touched.payment_first_quarterly_3 && Boolean(errors.payment_first_quarterly_3)}
                                                helperText={touched.payment_first_quarterly_3 && errors.payment_first_quarterly_3}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                    )}
                                </>
                                )} */}
                                {/* Legacy first/quarterly pricing inputs removed; using subscription options above */}
                                {isProgram &&
                                    <Grid item xs={12} md={4}>
                                        <CommonTextField
                                            name="register_link"
                                            label="Registration Link"
                                            value={values.register_link}
                                            onChange={e => setFieldValue("register_link", e.target.value)}
                                            error={touched.register_link && Boolean(errors.register_link)}
                                            helperText={errors.register_link}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
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
                                {isProgram && (
                                    <Grid item xs={12}>
                                        <CommonTextField
                                            name="card_short"
                                            label="Card Short Description"
                                            value={values.card_short}
                                            onChange={e => setFieldValue("card_short", e.target.value)}
                                            error={touched.card_short && Boolean(errors.card_short)}
                                            helperText={errors.card_short}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                )}
                                {(isProgram || isInexaProvider) && (
                                    <>
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                                Inexa Program Card (Course Detail Page)
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <CommonTextField
                                                name="program_card_title"
                                                label="Card Title"
                                                value={values.program_card_title}
                                                onChange={e => setFieldValue("program_card_title", e.target.value)}
                                                error={touched.program_card_title && Boolean(errors.program_card_title)}
                                                helperText={errors.program_card_title}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <CommonTextField
                                                name="program_card_subtitle"
                                                label="Card Subtitle"
                                                value={values.program_card_subtitle}
                                                onChange={e => setFieldValue("program_card_subtitle", e.target.value)}
                                                error={touched.program_card_subtitle && Boolean(errors.program_card_subtitle)}
                                                helperText={errors.program_card_subtitle}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            {(() => {
                                                const bullets = (values.program_card_bullets || "")
                                                    .split('\n')
                                                    .map(b => b.trim())
                                                    .filter(Boolean);
                                                return (
                                                    <>
                                                        <Box display="flex" gap={1} alignItems="center" mb={1}>
                                                            <CommonTextField
                                                                label="Add bullet point"
                                                                value={newProgramCardBullet}
                                                                onChange={e => setNewProgramCardBullet(e.target.value)}
                                                                disabled={mode === 'view'}
                                                                fullWidth
                                                            />
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                sx={{ whiteSpace: 'nowrap', px: 2, minWidth: 'auto' }}
                                                                onClick={() => {
                                                                    const text = (newProgramCardBullet || '').trim();
                                                                    if (!text) return;
                                                                    const current = (values.program_card_bullets || "")
                                                                        .split('\n')
                                                                        .map(b => b.trim())
                                                                        .filter(Boolean);
                                                                    const updated = [...current, text];
                                                                    setFieldValue("program_card_bullets", updated.join('\n'));
                                                                    setNewProgramCardBullet("");
                                                                }}
                                                                disabled={mode === 'view'}
                                                            >
                                                                Add
                                                            </Button>
                                                        </Box>
                                                        {bullets.length > 0 && (
                                                            <Box mt={1}>
                                                                {bullets.map((b, idx) => (
                                                                    <Box
                                                                        key={idx}
                                                                        display="flex"
                                                                        alignItems="center"
                                                                        justifyContent="space-between"
                                                                        mb={0.5}
                                                                        sx={{ border: '1px solid #eee', borderRadius: 1, px: 1, py: 0.5 }}
                                                                    >
                                                                        <Typography variant="body2">{b}</Typography>
                                                                        <Button
                                                                            size="small"
                                                                            color="error"
                                                                            sx={{ minWidth: 'auto', px: 1.5 }}
                                                                            onClick={() => {
                                                                                const updated = bullets.filter((_, i) => i !== idx);
                                                                                setFieldValue("program_card_bullets", updated.join('\n'));
                                                                            }}
                                                                            disabled={mode === 'view'}
                                                                        >
                                                                            Remove
                                                                        </Button>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        )}
                                                        {touched.program_card_bullets && errors.program_card_bullets && (
                                                            <FormHelperText error>{errors.program_card_bullets}</FormHelperText>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <CommonTextField
                                                name="program_card_caption"
                                                label="Card Caption (optional line under bullets)"
                                                value={values.program_card_caption}
                                                onChange={e => setFieldValue("program_card_caption", e.target.value)}
                                                error={touched.program_card_caption && Boolean(errors.program_card_caption)}
                                                helperText={errors.program_card_caption}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <CommonTextField
                                                name="program_card_info_url"
                                                label="More Info URL (e.g. /info/your-program)"
                                                value={values.program_card_info_url}
                                                onChange={e => setFieldValue("program_card_info_url", e.target.value)}
                                                error={touched.program_card_info_url && Boolean(errors.program_card_info_url)}
                                                helperText={errors.program_card_info_url}
                                                disabled={mode === 'view'}
                                            />
                                        </Grid>
                                    </>
                                )}
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            name="cert_and_cred_pathways"
                                            label="Certificate and Credit Pathways (Bold for heading and under bold text, simple text as description)"
                                            value={values.cert_and_cred_pathways}
                                            onChange={val => setFieldValue("cert_and_cred_pathways", !val || val === "null" ? "" : val)}
                                            error={touched.cert_and_cred_pathways && Boolean(errors.cert_and_cred_pathways)}
                                            helperText={errors.cert_and_cred_pathways}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextField
                                            name="degree_detail_short_desc"
                                            label="Degree Detail Short Description"
                                            value={values.degree_detail_short_desc}
                                            onChange={e => setFieldValue("degree_detail_short_desc", e.target.value)}
                                            error={touched.degree_detail_short_desc && Boolean(errors.degree_detail_short_desc)}
                                            helperText={errors.degree_detail_short_desc}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextField
                                            name="admission_steps_desc"
                                            label="Admission Steps Short Description"
                                            value={values.admission_steps_desc}
                                            onChange={e => setFieldValue("admission_steps_desc", e.target.value)}
                                            error={touched.admission_steps_desc && Boolean(errors.admission_steps_desc)}
                                            helperText={errors.admission_steps_desc}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            name="admission_steps"
                                            label="Admission Steps (Bold for title and under bold text, simple text as description)"
                                            value={values.admission_steps}
                                            onChange={val => setFieldValue("admission_steps", !val || val === "null" ? "" : val)}
                                            error={touched.admission_steps && Boolean(errors.admission_steps)}
                                            helperText={errors.admission_steps}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            name="course_snapshot"
                                            label="Course Snapshots(Only bullet points)"
                                            value={values.course_snapshot}
                                            onChange={val => setFieldValue("course_snapshot", !val || val === "null" ? "" : val)}
                                            error={touched.course_snapshot && Boolean(errors.course_snapshot)}
                                            helperText={errors.course_snapshot}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            name="key_highlights"
                                            label="Key Highlights of the Program(Only bullet points)"
                                            value={values.key_highlights}
                                            onChange={val => setFieldValue("key_highlights", !val || val === "null" ? "" : val)}
                                            error={touched.key_highlights && Boolean(errors.key_highlights)}
                                            helperText={errors.key_highlights}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram &&
                                    <Grid item xs={12}>
                                        <CommonTextEditor
                                            name="fee_highlights"
                                            label="Key Highlights(Present next to Degree Breakdown)"
                                            value={values.fee_highlights}
                                            onChange={val => setFieldValue("fee_highlights", !val || val === "null" ? "" : val)}
                                            error={touched.fee_highlights && Boolean(errors.fee_highlights)}
                                            helperText={errors.fee_highlights}
                                            disabled={mode === 'view'}
                                        />
                                    </Grid>
                                }
                                {isProgram && providerInput !== "edx" &&
                                    <Grid item xs={12}>
                                        <Box display="flex" alignItems="center" gap={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    name="disclaimer"
                                                    checked={values.disclaimer}
                                                    onChange={e => setFieldValue("disclaimer", e.target.checked)}
                                                    disabled={mode === 'view'}
                                                />
                                            }
                                            label="Disclaimer"
                                        />

                                        {(() => {
                                                const selectedProgramType = filters.program_types?.find(pt => pt.id === values.program_type);
                                                const isMicroProgram = selectedProgramType?.name === "MicroMasters" || selectedProgramType?.name === "MicroBachelors";
                                                return isMicroProgram && (
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                name="trademark"
                                                                checked={values.trademark}
                                                                onChange={e => setFieldValue("trademark", e.target.checked)}
                                                                disabled={mode === 'view'}
                                                            />
                                                        }
                                                        label="Trademark"
                                                    />
                                                );
                                            })()}
                                        </Box>
                                        {touched.disclaimer && Boolean(errors.disclaimer) && (
                                            <FormHelperText error>{errors.disclaimer}</FormHelperText>
                                        )}
                                         {touched.trademark && Boolean(errors.trademark) && (
                                            <FormHelperText error>{errors.trademark}</FormHelperText>
                                        )}
                                    </Grid>
                                }
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
                                        onClick={() => { pageType === "programs" ? navigate("/programs") : navigate("/courses") }}
                                    >
                                        Cancel
                                    </Button>
                                </Grid>
                            </Grid>
                            <Dialog
                                open={isCountryCostModalOpen}
                                onClose={handleCloseCountryCostModal}
                                fullWidth
                                maxWidth="sm"
                                PaperProps={{
                                    sx: {
                                        bgcolor: "#fff",
                                        color: "text.primary",
                                        backgroundImage: "none",
                                    },
                                }}
                            >
                                <DialogTitle>{countryCostModalMode === "edit" ? "Edit Country Price" : "Add Country Price"}</DialogTitle>
                                <DialogContent>
                                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                        <Grid item xs={12}>
                                            <TextField
                                                select
                                                fullWidth
                                                label="Country"
                                                value={countryCostForm.countryCode}
                                                onChange={(e) => handleCountryCostFormChange("countryCode", e.target.value)}
                                            >
                                                <MenuItem value="DEFAULT">Default (All Countries)</MenuItem>
                                                {countries.map((country) => (
                                                    <MenuItem key={country.iso} value={country.iso}>
                                                        {country.country} ({country.iso})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Self Cost"
                                                value={countryCostForm.selfCost}
                                                onChange={(e) => handleCountryCostFormChange("selfCost", e.target.value)}
                                            />
                                        </Grid>
                                    </Grid>
                                </DialogContent>
                                <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button onClick={handleCloseCountryCostModal} variant="outlined">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSaveCountryCost} variant="contained" color="secondary">
                                        Save
                                    </Button>
                                </DialogActions>
                            </Dialog>
                            <Dialog
                                open={Boolean(deleteCountryCostRow)}
                                onClose={() => setDeleteCountryCostRow(null)}
                                fullWidth
                                maxWidth="xs"
                            >
                                <DialogTitle>Delete Country Price</DialogTitle>
                                <DialogContent>
                                    <Typography variant="body2" color="text.secondary">
                                        Are you sure you want to delete this pricing row?
                                    </Typography>
                                </DialogContent>
                                <DialogActions sx={{ px: 3, pb: 2 }}>
                                    <Button onClick={() => setDeleteCountryCostRow(null)} variant="outlined">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleConfirmDeleteCountryCost} variant="contained" color="error">
                                        Delete
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </Form>
                    );
                }}
            </Formik>
        </Box>
    );
};

export default CourseForm; 