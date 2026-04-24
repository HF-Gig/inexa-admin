import {
    Box,
    Button,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography,
    useTheme,
    Divider,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { FieldArray, Formik } from "formik";
import * as Yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";
import api from "../../helpers/api";
import countries from "../../assets/countries.json";
import CommonTable from "../../components/CommonTable";

const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Annual subscription / once-off total: interactive + self. */
const annualSubscriptionTotalFromCosts = (interactive, self) => {
    const i = Number(interactive);
    const s = Number(self);
    const ii = Number.isFinite(i) ? i : 0;
    const ss = Number.isFinite(s) ? s : 0;
    if (ii <= 0 && ss <= 0) return 0;
    // return roundMoney(2 * ii + ss);
    return roundMoney(ii + ss);
};

/**
 * Same rule as learner checkout: if geo country matches a non-empty country row, preview uses that row
 * in the visitor currency (from geo); otherwise the first row (default / all countries) in USD.
 */
const pickPreviewCostRow = (countryCosts, detectedCountryCode) => {
    const list = Array.isArray(countryCosts) ? countryCosts : [];
    const geo = String(detectedCountryCode || "US").toUpperCase();
    const defaultRow = list[0] || {};
    const matched = list.find(
        (e) => e?.countryCode && String(e.countryCode).toUpperCase() === geo
    );
    if (!matched) {
        return { row: defaultRow, useLearnerLocale: false };
    }
    return { row: matched, useLearnerLocale: true };
};

/** Matches learner checkout: local currency (whole amounts) when a country row matches IP; otherwise USD $x.xx on the default row. */
const formatAdminPreviewMoney = (amount, useLearnerLocale, currencyCode) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "—";
    const cur = String(currencyCode || "USD").toUpperCase();
    if (!useLearnerLocale || cur === "USD") {
        return `$${roundMoney(n).toFixed(2)}`;
    }
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: cur,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(n));
    } catch {
        return `${cur} ${Math.round(n)}`;
    }
};

/** Derive first-payment % from stored dollars and annual total (for edit mode). */
const pctFromDollars = (total, dollars) => {
    const t = Number(total);
    const d = Number(dollars);
    if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(d)) return "";
    return roundMoney((d / t) * 100);
};

const Costs = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [selectedProvider, setSelectedProvider] = useState(1);
    const [geoCountryCode, setGeoCountryCode] = useState("US");
    const [geoCurrencyCode, setGeoCurrencyCode] = useState("USD");

    useEffect(() => {
        const loadGeo = async () => {
            try {
                const geoResponse = await fetch("https://ipapi.co/json/");
                if (!geoResponse.ok) return;
                const geoData = await geoResponse.json();
                const detected = String(geoData?.country_code || "US").toUpperCase();
                setGeoCountryCode(detected);
                const cur = String(geoData?.currency || "USD").toUpperCase();
                if (cur) setGeoCurrencyCode(cur);
            } catch (e) {
                console.error("[Costs] Geo lookup failed", e);
            }
        };
        loadGeo();
    }, []);

    const fetchRows = async (providerId = selectedProvider) => {
        try {
            setLoading(true);
            const response = await api.get(`/costs?providerId=${providerId}`);
            setRows(response.data?.data || []);
        } catch (error) {
            console.error("Fetch costs configs error", error);
            setErrorMessage("Failed to load costs configurations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRows(selectedProvider);
    }, [selectedProvider]);

    const groupedRows = Object.values(
        rows
            .filter((row) => row.course_id === null)
            .reduce((acc, row) => {
                const providerKey = String(row.provider_id);
                if (!acc[providerKey]) {
                    acc[providerKey] = {
                        provider_id: row.provider_id,
                        ids: [],
                        countries: [],
                    };
                }
                acc[providerKey].ids.push(row.id);
                acc[providerKey].countries.push(row.country_code === "DEFAULT" ? "Default (All)" : row.country_code);
                return acc;
            }, {})
    ).map((group) => ({
        ...group,
        total_countries: group.countries.length,
        country_list: group.countries.join(", "),
    }));

    const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const pct2 = Number(values.pctFirst3060);
            const pct3 = Number(values.pctFirstMonthly11);
            const pct4 = Number(values.pctFirstQuarterly3);

            const maxPreviewAnnual = Math.max(
                0,
                ...(Array.isArray(values.countryCosts) ? values.countryCosts : []).map((e) =>
                    annualSubscriptionTotalFromCosts(e?.interactiveCost, e?.selfCost)
                )
            );

            if (values.paymentOptionThirtySixty && maxPreviewAnnual > 0) {
                if (!Number.isFinite(pct2) || pct2 < 0 || pct2 > 100) {
                    setErrorMessage("Case 2: First payment percentage must be between 0 and 100.");
                    setSubmitting(false);
                    return;
                }
            }
            if (values.paymentOptionMonthly11 && maxPreviewAnnual > 0) {
                if (!Number.isFinite(pct3) || pct3 < 0 || pct3 > 100) {
                    setErrorMessage("Case 3: First payment percentage must be between 0 and 100.");
                    setSubmitting(false);
                    return;
                }
            }
            if (values.paymentOptionQuarterly3 && maxPreviewAnnual > 0) {
                if (!Number.isFinite(pct4) || pct4 < 0 || pct4 > 100) {
                    setErrorMessage("Case 4: First payment percentage must be between 0 and 100.");
                    setSubmitting(false);
                    return;
                }
            }

            const buildPaymentFieldsForAnnual = (annualTotal) => {
                let paymentFirst3060 = "";
                let paymentSecondThird3060 = "";
                if (values.paymentOptionThirtySixty && annualTotal > 0 && Number.isFinite(pct2)) {
                    paymentFirst3060 = roundMoney((annualTotal * pct2) / 100);
                    const remainder = roundMoney(annualTotal - paymentFirst3060);
                    paymentSecondThird3060 = roundMoney(remainder / 2);
                }
                let paymentFirstMonthly11 = "";
                if (values.paymentOptionMonthly11 && annualTotal > 0 && Number.isFinite(pct3)) {
                    paymentFirstMonthly11 = roundMoney((annualTotal * pct3) / 100);
                }
                let paymentFirstQuarterly3 = "";
                if (values.paymentOptionQuarterly3 && annualTotal > 0 && Number.isFinite(pct4)) {
                    paymentFirstQuarterly3 = roundMoney((annualTotal * pct4) / 100);
                }
                return {
                    paymentOnceOffAmount: annualTotal > 0 ? annualTotal : "",
                    paymentFirst3060,
                    paymentSecond3060: paymentSecondThird3060,
                    paymentThird3060: paymentSecondThird3060,
                    paymentFirstMonthly11,
                    paymentFirstQuarterly3,
                };
            };

            const commonPayloadBase = {
                providerId: values.providerId,
                interactiveCaption: values.interactiveCaption,
                selfCaption: values.selfCaption,
                paymentTypeSelf: values.paymentTypeSelf,
                paymentTypeInteractive: values.paymentTypeInteractive,
                paymentOptionOnceOff: values.paymentOptionOnceOff,
                paymentOptionThirtySixty: values.paymentOptionThirtySixty,
                paymentOptionMonthly11: values.paymentOptionMonthly11,
                paymentOptionQuarterly3: values.paymentOptionQuarterly3,
            };

            const countryCosts = Array.isArray(values.countryCosts) && values.countryCosts.length
                ? values.countryCosts
                : [{ countryCode: "", interactiveCost: "", selfCost: "" }];

            if (editingRow) {
                const existingEntries = Array.isArray(editingRow.countryCosts) ? editingRow.countryCosts : [];
                const existingByCountry = new Map(existingEntries.map((entry) => [entry.countryCode || "", entry]));
                const submittedCountries = new Set();

                for (const entry of countryCosts) {
                    const countryCode = entry.countryCode || "";
                    submittedCountries.add(countryCode);
                    const existing = existingByCountry.get(countryCode);
                    const annualTotal = annualSubscriptionTotalFromCosts(entry.interactiveCost, entry.selfCost);
                    const paymentFields = buildPaymentFieldsForAnnual(annualTotal);

                    if (existing?.id) {
                        await api.put(`/costs/${existing.id}`, {
                            ...commonPayloadBase,
                            ...paymentFields,
                            countryCode,
                            interactiveCost: entry.interactiveCost,
                            selfCost: entry.selfCost,
                        });
                    } else {
                        await api.post("/costs/update", {
                            ...commonPayloadBase,
                            ...paymentFields,
                            countryCode,
                            interactiveCost: entry.interactiveCost,
                            selfCost: entry.selfCost,
                        });
                    }
                }

                for (const existing of existingEntries) {
                    const existingCountry = existing.countryCode || "";
                    if (!submittedCountries.has(existingCountry) && existing.id) {
                        await api.delete(`/costs/${existing.id}`);
                    }
                }
            } else {
                for (const entry of countryCosts) {
                    const annualTotal = annualSubscriptionTotalFromCosts(entry.interactiveCost, entry.selfCost);
                    const paymentFields = buildPaymentFieldsForAnnual(annualTotal);
                    await api.post("/costs/update", {
                        ...commonPayloadBase,
                        ...paymentFields,
                        countryCode: entry.countryCode,
                        interactiveCost: entry.interactiveCost,
                        selfCost: entry.selfCost,
                    });
                }
            }

            setSuccessMessage("Cost configuration saved successfully.");
            fetchRows(values.providerId);
            resetForm();
            setIsCreateMode(false);
            setEditingRow(null);
        } catch (error) {
            console.error("Update error", error);
            setErrorMessage(error.response?.data?.error || "An error occurred while updating costs.");
        } finally {
            setSubmitting(false);
        }
    };

    const commonConfig =
        editingRow?.commonConfig ||
        rows.find((row) => row.country_code === "DEFAULT" && row.course_id === null) ||
        rows.find((row) => row.course_id === null) ||
        null;

    const annualForPctFromCommon = (() => {
        const fromCosts = annualSubscriptionTotalFromCosts(
            commonConfig?.interactive_cost,
            commonConfig?.self_cost
        );
        return fromCosts > 0 ? fromCosts : Number(commonConfig?.payment_once_off_amount || 0);
    })();

    const initialValues = {
        providerId: editingRow?.provider_id ?? selectedProvider,
        countryCosts: editingRow?.countryCosts?.length
            ? editingRow.countryCosts.map((entry) => ({
                id: entry.id,
                countryCode: entry.countryCode ?? "",
                interactiveCost: entry.interactiveCost ?? "",
                selfCost: entry.selfCost ?? "",
            }))
            : [
                {
                    countryCode: editingRow?.country_code === "DEFAULT" ? "" : (editingRow?.country_code || ""),
                    interactiveCost: editingRow?.interactive_cost ?? "",
                    selfCost: editingRow?.self_cost ?? "",
                },
            ],
        interactiveCaption: commonConfig?.interactive_caption ?? "",
        selfCaption: commonConfig?.self_caption ?? "",
        paymentTypeSelf: commonConfig?.payment_type_self ?? "",
        paymentTypeInteractive: commonConfig?.payment_type_interactive ?? "",
        paymentOptionOnceOff: commonConfig?.payment_option_once_off ?? true,
        paymentOptionThirtySixty: commonConfig?.payment_option_thirty_sixty ?? true,
        paymentOptionMonthly11: commonConfig?.payment_option_monthly_11 ?? true,
        paymentOptionQuarterly3: commonConfig?.payment_option_quarterly_3 ?? true,
        pctFirst3060: pctFromDollars(annualForPctFromCommon, commonConfig?.payment_first_30_60),
        pctFirstMonthly11: pctFromDollars(annualForPctFromCommon, commonConfig?.payment_first_monthly_11),
        pctFirstQuarterly3: pctFromDollars(annualForPctFromCommon, commonConfig?.payment_first_quarterly_3),
    };

    const handleEdit = (row) => {
        const providerRows = rows.filter((r) => Number(r.provider_id) === Number(row.provider_id) && r.course_id === null);
        const defaultRow = providerRows.find((r) => r.country_code === "DEFAULT");
        const common = defaultRow || providerRows[0] || null;
        setEditingRow({
            provider_id: row.provider_id,
            commonConfig: common,
            countryCosts: providerRows.map((r) => ({
                id: r.id,
                countryCode: r.country_code === "DEFAULT" ? "" : r.country_code,
                interactiveCost: r.interactive_cost ?? "",
                selfCost: r.self_cost ?? "",
            })),
        });
        setIsCreateMode(true);
    };

    const handleDelete = async (row) => {
        const ok = window.confirm("Are you sure you want to delete this cost configuration?");
        if (!ok) return;
        try {
            const idsToDelete = Array.isArray(row.ids) && row.ids.length ? row.ids : [row.id];
            for (const id of idsToDelete) {
                await api.delete(`/costs/${id}`);
            }
            setSuccessMessage("Cost configuration(s) deleted successfully.");
            fetchRows(selectedProvider);
        } catch (error) {
            console.error("Delete cost config error", error);
            setErrorMessage("Failed to delete cost configuration.");
        }
    };

    const checkoutSchema = Yup.object().shape({
        providerId: Yup.number().required("Provider is required"),
        countryCosts: Yup.array().of(
            Yup.object().shape({
                countryCode: Yup.string().nullable(),
                interactiveCost: Yup.number().typeError("Must be a number").nullable(),
                selfCost: Yup.number().typeError("Must be a number").nullable(),
            })
        ).min(1, "At least one country cost is required"),
        interactiveCaption: Yup.string().nullable(),
        selfCaption: Yup.string().nullable(),
        paymentTypeSelf: Yup.string().nullable(),
        paymentTypeInteractive: Yup.string().nullable(),
        paymentOptionOnceOff: Yup.boolean().required(),
        paymentOptionThirtySixty: Yup.boolean().required(),
        paymentOptionMonthly11: Yup.boolean().required(),
        paymentOptionQuarterly3: Yup.boolean().required(),
        pctFirst3060: Yup.number().typeError("Must be a number").min(0).max(100).nullable(),
        pctFirstMonthly11: Yup.number().typeError("Must be a number").min(0).max(100).nullable(),
        pctFirstQuarterly3: Yup.number().typeError("Must be a number").min(0).max(100).nullable(),
    });

    return (
        <Box m="20px">
            <Header
                title="COSTS"
                subtitle="Manage available cost configurations per country"
                action={
                    !isCreateMode ? (
                        <Box display="flex" gap={2}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id="provider-filter-label">Provider</InputLabel>
                                <Select
                                    labelId="provider-filter-label"
                                    value={selectedProvider}
                                    label="Provider"
                                    onChange={(e) => setSelectedProvider(Number(e.target.value))}
                                >
                                    <MenuItem value={1}>Edx (ID: 1)</MenuItem>
                                    <MenuItem value={7}>Inexa (ID: 7)</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="contained" color="secondary" onClick={() => setIsCreateMode(true)}>
                                Create
                            </Button>
                        </Box>
                    ) : null
                }
            />

            {successMessage && (
                <Box mb="20px" p="10px" bgcolor="#4cceac" color="white" borderRadius="4px">
                    {successMessage}
                </Box>
            )}
            {errorMessage && (
                <Box mb="20px" p="10px" bgcolor="#db4f4a" color="white" borderRadius="4px">
                    {errorMessage}
                </Box>
            )}

            {!isCreateMode ? (
                <CommonTable
                    columns={[
                        {
                            name: "provider_name",
                            label: "Provider",
                            render: (row) => Number(row.provider_id) === 1 ? "Edx" : Number(row.provider_id) === 7 ? "Inexa" : `Provider ${row.provider_id}`
                        },
                        {
                            name: "country_code",
                            label: "Country",
                            render: (row) => `${row.country_list} (${row.total_countries})`
                        },
                    ]}
                    data={groupedRows}
                    total={groupedRows.length}
                    page={0}
                    rowsPerPage={groupedRows.length || 10}
                    loading={loading}
                    onPageChange={() => { }}
                    onRowsPerPageChange={() => { }}
                    actions={(row) => (
                        <Box display="flex" gap={1}>
                            <IconButton size="small" sx={{ color: '#ff9800' }} onClick={() => handleEdit(row)}>
                                <Edit />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#f44336' }} onClick={() => handleDelete(row)}>
                                <Delete />
                            </IconButton>
                        </Box>
                    )}
                />
            ) : (
                <Box mt="20px" p="20px" border="1px solid #ddd" borderRadius="8px">
                    <Typography variant="h5" mb="20px">{editingRow ? "Edit Cost Configuration" : "Create Cost Configuration"}</Typography>
                    <Formik
                        onSubmit={handleFormSubmit}
                        initialValues={initialValues}
                        validationSchema={checkoutSchema}
                        enableReinitialize
                    >
                        {({
                            values,
                            errors,
                            touched,
                            handleBlur,
                            handleChange,
                            handleSubmit,
                            setFieldValue,
                            isSubmitting,
                        }) => {
                            const previewPick = pickPreviewCostRow(values.countryCosts, geoCountryCode);
                            const previewAnnual = annualSubscriptionTotalFromCosts(
                                previewPick.row?.interactiveCost,
                                previewPick.row?.selfCost
                            );
                            const previewFmt = (amt) =>
                                formatAdminPreviewMoney(amt, previewPick.useLearnerLocale, geoCurrencyCode);
                            return (
                            <form onSubmit={handleSubmit}>
                                <Typography variant="h6" mb="12px">1) Provider and Country Costs</Typography>
                                <Box
                                    display="grid"
                                    gap="20px"
                                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                    sx={{
                                        "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                                    }}
                                >
                                    <FormControl fullWidth sx={{ gridColumn: "span 4" }}>
                                        <InputLabel id="provider-select-label">Provider</InputLabel>
                                        <Select
                                            labelId="provider-select-label"
                                            id="providerId"
                                            name="providerId"
                                            value={values.providerId}
                                            label="Provider"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            error={!!touched.providerId && !!errors.providerId}
                                        >
                                            <MenuItem value={1}>Edx (ID: 1)</MenuItem>
                                            <MenuItem value={7}>Inexa (ID: 7)</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FieldArray name="countryCosts">
                                        {({ push, remove }) => (
                                            <Box sx={{ gridColumn: "span 4" }}>
                                                {values.countryCosts.map((entry, idx) => (
                                                    <Box
                                                        key={idx}
                                                        display="grid"
                                                        gap="20px"
                                                        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        <FormControl fullWidth sx={{ gridColumn: "span 2" }}>
                                                            <InputLabel id={`country-select-label-${idx}`}>Country (optional)</InputLabel>
                                                            <Select
                                                                labelId={`country-select-label-${idx}`}
                                                                name={`countryCosts.${idx}.countryCode`}
                                                                value={entry.countryCode}
                                                                label="Country (optional)"
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                            >
                                                                <MenuItem value="">Default (All Countries)</MenuItem>
                                                                {countries.map((country) => (
                                                                    <MenuItem key={country.iso} value={country.iso}>
                                                                        {country.country} ({country.iso})
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                        <TextField
                                                            fullWidth
                                                            variant="filled"
                                                            type="number"
                                                            label="Interactive Cost"
                                                            onBlur={handleBlur}
                                                            onChange={handleChange}
                                                            value={entry.interactiveCost}
                                                            name={`countryCosts.${idx}.interactiveCost`}
                                                            sx={{ gridColumn: "span 1" }}
                                                        />
                                                        <TextField
                                                            fullWidth
                                                            variant="filled"
                                                            type="number"
                                                            label="Self Cost"
                                                            onBlur={handleBlur}
                                                            onChange={handleChange}
                                                            value={entry.selfCost}
                                                            name={`countryCosts.${idx}.selfCost`}
                                                            sx={{ gridColumn: "span 1" }}
                                                        />
                                                        {idx > 0 && (
                                                            <Box sx={{ gridColumn: "span 4" }}>
                                                                <Button color="error" variant="text" onClick={() => remove(idx)}>
                                                                    Remove
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="outlined"
                                                    startIcon={<AddCircleOutlineIcon />}
                                                    onClick={() => push({ countryCode: "", interactiveCost: "", selfCost: "" })}
                                                >
                                                    Add
                                                </Button>
                                            </Box>
                                        )}
                                    </FieldArray>
                                </Box>

                                <Divider sx={{ my: 3 }} />
                                <Typography variant="h6" mb="12px">2) Subscription Payment Options</Typography>
                                <Typography variant="body2" sx={{ color: colors.gray[100], mb: 2 }}>
                                    {/* Annual subscription total (same as once-off) is <strong>2 × Interactive cost + Self cost</strong> per country row. Installment percentages apply to that total; amounts are saved per country. The preview below follows the same rule as the learner site: if your IP country matches a configured country row, that row is used with the local currency from your IP; otherwise the default (first) row is shown in USD. All options are enabled by default for edX courses. */}
                                    Annual subscription total (same as once-off) is <strong>Interactive cost + Self cost</strong> per country row. Installment percentages apply to that total; amounts are saved per country. The preview below follows the same rule as the learner site: if your IP country matches a configured country row, that row is used with the local currency from your IP; otherwise the default (first) row is shown in USD. All options are enabled by default for edX courses.
                                </Typography>
                                <Box mb={2} maxWidth={560}>
                                    <Typography variant="body2">
                                        Annual total (preview, your IP {geoCountryCode}
                                        {previewPick.useLearnerLocale
                                            ? `, row ${previewPick.row?.countryCode}`
                                            : ", default row"}
                                        ):{" "}
                                        <strong>
                                            {previewAnnual > 0 ? previewFmt(previewAnnual) : "—"}
                                        </strong>
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ color: colors.gray[100], mt: 0.5 }}>
                                        {/* Formula: (2 × Interactive) + Self. Add interactive and self costs in section 1. */}
                                        Formula: (Interactive) + Self. Add interactive and self costs in section 1.
                                    </Typography>
                                </Box>
                                <FormGroup>
                                    <Box mb={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.paymentOptionOnceOff)}
                                                    onChange={(e) => setFieldValue("paymentOptionOnceOff", e.target.checked)}
                                                />
                                            }
                                            label={`Once-off payment of ${previewAnnual > 0 ? previewFmt(previewAnnual) : "—"}`}
                                        />
                                    </Box>

                                    <Box mb={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.paymentOptionThirtySixty)}
                                                    onChange={(e) => setFieldValue("paymentOptionThirtySixty", e.target.checked)}
                                                />
                                            }
                                            label="First payment (% of annual total), then 2 equal payments at 30 and 60 days"
                                        />
                                        {Boolean(values.paymentOptionThirtySixty) && (
                                            <Box pl={4} pt={1} display="grid" gap="12px" gridTemplateColumns="repeat(2, minmax(0, 1fr))">
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="First payment (%)"
                                                    name="pctFirst3060"
                                                    value={values.pctFirst3060}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    inputProps={{ min: 0, max: 100, step: "0.01" }}
                                                />
                                                {/* <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="text"
                                                    label="2nd & 3rd payment (each, calculated)"
                                                    value={(() => {
                                                        const t = previewAnnual;
                                                        const p = Number(values.pctFirst3060);
                                                        if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(p)) return "—";
                                                        const first = roundMoney((t * p) / 100);
                                                        const each = roundMoney((t - first) / 2);
                                                        return previewFmt(each);
                                                    })()}
                                                    InputProps={{ readOnly: true }}
                                                /> */}
                                                <Typography variant="caption" sx={{ gridColumn: "span 2", color: colors.gray[100] }}>
                                                    Example: 20% first → 40% of total for day 30 and 40% for day 60. Example: 33.33% first → ~33.33% each for three equal payments.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box mb={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.paymentOptionMonthly11)}
                                                    onChange={(e) => setFieldValue("paymentOptionMonthly11", e.target.checked)}
                                                />
                                            }
                                            label="First payment (% of annual total), then 11 equal monthly payments"
                                        />
                                        {Boolean(values.paymentOptionMonthly11) && (
                                            <Box pl={4} pt={1} display="grid" gap="12px" maxWidth={480}>
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="First payment (%)"
                                                    name="pctFirstMonthly11"
                                                    value={values.pctFirstMonthly11}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    inputProps={{ min: 0, max: 100, step: "0.01" }}
                                                />
                                                <Typography variant="caption" sx={{ color: colors.gray[100] }}>
                                                    Each monthly payment (calculated on checkout):{" "}
                                                    {(() => {
                                                        const t = previewAnnual;
                                                        const p = Number(values.pctFirstMonthly11);
                                                        if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(p)) return "—";
                                                        const first = roundMoney((t * p) / 100);
                                                        const monthly = roundMoney((t - first) / 11);
                                                        return previewFmt(monthly);
                                                    })()}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box mb={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.paymentOptionQuarterly3)}
                                                    onChange={(e) => setFieldValue("paymentOptionQuarterly3", e.target.checked)}
                                                />
                                            }
                                            label="First payment (% of annual total), then 3 equal quarterly payments"
                                        />
                                        {Boolean(values.paymentOptionQuarterly3) && (
                                            <Box pl={4} pt={1} display="grid" gap="12px" maxWidth={480}>
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="First payment (%)"
                                                    name="pctFirstQuarterly3"
                                                    value={values.pctFirstQuarterly3}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    inputProps={{ min: 0, max: 100, step: "0.01" }}
                                                />
                                                <Typography variant="caption" sx={{ color: colors.gray[100] }}>
                                                    Each quarterly payment (calculated on checkout):{" "}
                                                    {(() => {
                                                        const t = previewAnnual;
                                                        const p = Number(values.pctFirstQuarterly3);
                                                        if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(p)) return "—";
                                                        const first = roundMoney((t * p) / 100);
                                                        const q = roundMoney((t - first) / 3);
                                                        return previewFmt(q);
                                                    })()}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </FormGroup>

                                <Divider sx={{ my: 3 }} />
                                <Typography variant="h6" mb="12px">3) Common Captions and Payment Types</Typography>
                                <Box
                                    display="grid"
                                    gap="20px"
                                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                    sx={{
                                        "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Interactive Caption"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.interactiveCaption}
                                        name="interactiveCaption"
                                        error={!!touched.interactiveCaption && !!errors.interactiveCaption}
                                        helperText={touched.interactiveCaption && errors.interactiveCaption}
                                        sx={{ gridColumn: "span 2" }}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Self Caption"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.selfCaption}
                                        name="selfCaption"
                                        helperText={touched.selfCaption && errors.selfCaption}
                                        sx={{ gridColumn: "span 2" }}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Self Payment Type"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.paymentTypeSelf}
                                        name="paymentTypeSelf"
                                        error={!!touched.paymentTypeSelf && !!errors.paymentTypeSelf}
                                        helperText={touched.paymentTypeSelf && errors.paymentTypeSelf}
                                        sx={{ gridColumn: "span 2" }}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Interactive Payment Type"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.paymentTypeInteractive}
                                        name="paymentTypeInteractive"
                                        error={!!touched.paymentTypeInteractive && !!errors.paymentTypeInteractive}
                                        helperText={touched.paymentTypeInteractive && errors.paymentTypeInteractive}
                                        sx={{ gridColumn: "span 2" }}
                                    />
                                </Box>
                                <Box display="flex" justifyContent="end" gap={2} mt="20px">
                                    <Button onClick={() => { setIsCreateMode(false); setEditingRow(null); }} variant="outlined">Cancel</Button>
                                    <Button
                                        type="submit"
                                        color="secondary"
                                        variant="contained"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Saving..." : (editingRow ? "Update" : "Create")}
                                    </Button>
                                </Box>
                            </form>
                            );
                        }}
                    </Formik>
                </Box>
            )}
        </Box>
    );
};

export default Costs;
