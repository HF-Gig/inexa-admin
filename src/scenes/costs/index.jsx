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
            const secondAndThird3060 = values.paymentSecondThird3060 === "" || values.paymentSecondThird3060 === null || values.paymentSecondThird3060 === undefined
                ? ""
                : Number(values.paymentSecondThird3060);

            const commonPayload = {
                providerId: values.providerId,
                interactiveCaption: values.interactiveCaption,
                selfCaption: values.selfCaption,
                paymentTypeSelf: values.paymentTypeSelf,
                paymentTypeInteractive: values.paymentTypeInteractive,
                paymentOptionOnceOff: values.paymentOptionOnceOff,
                paymentOptionThirtySixty: values.paymentOptionThirtySixty,
                paymentOptionMonthly11: values.paymentOptionMonthly11,
                paymentOptionQuarterly3: values.paymentOptionQuarterly3,
                paymentOnceOffAmount: values.paymentOnceOffAmount,
                paymentFirst3060: values.paymentFirst3060,
                // Admin inputs a combined amount; we split equally for day 30 and day 60.
                paymentSecond3060: secondAndThird3060,
                paymentThird3060: secondAndThird3060,
                paymentFirstMonthly11: values.paymentFirstMonthly11,
                paymentFirstQuarterly3: values.paymentFirstQuarterly3,
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

                    if (existing?.id) {
                        await api.put(`/costs/${existing.id}`, {
                            ...commonPayload,
                            countryCode,
                            interactiveCost: entry.interactiveCost,
                            selfCost: entry.selfCost,
                        });
                    } else {
                        await api.post("/costs/update", {
                            ...commonPayload,
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
                    await api.post("/costs/update", {
                        ...commonPayload,
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
        paymentOnceOffAmount: commonConfig?.payment_once_off_amount ?? "",
        paymentFirst3060: commonConfig?.payment_first_30_60 ?? "",
        paymentSecondThird3060: commonConfig?.payment_second_30_60 ?? "",
        paymentFirstMonthly11: commonConfig?.payment_first_monthly_11 ?? "",
        paymentFirstQuarterly3: commonConfig?.payment_first_quarterly_3 ?? "",
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
        paymentOnceOffAmount: Yup.number().typeError("Must be a number").nullable(),
        paymentFirst3060: Yup.number().typeError("Must be a number").nullable(),
        paymentSecondThird3060: Yup.number().typeError("Must be a number").nullable(),
        paymentFirstMonthly11: Yup.number().typeError("Must be a number").nullable(),
        paymentFirstQuarterly3: Yup.number().typeError("Must be a number").nullable(),
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
                        }) => (
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
                                    All options are enabled by default for edX courses.
                                </Typography>
                                <FormGroup>
                                    <Box mb={2}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(values.paymentOptionOnceOff)}
                                                    onChange={(e) => setFieldValue("paymentOptionOnceOff", e.target.checked)}
                                                />
                                            }
                                            label="Once-off payment of $1190"
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
                                            label="First payment (custom amount), then 2 additional payments over 30 and 60 days"
                                        />
                                        {Boolean(values.paymentOptionThirtySixty) && (
                                            <Box pl={4} pt={1} display="grid" gap="12px" gridTemplateColumns="repeat(2, minmax(0, 1fr))">
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="First payment"
                                                    name="paymentFirst3060"
                                                    value={values.paymentFirst3060}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                />
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="Second and Third payment amount"
                                                    name="paymentSecondThird3060"
                                                    value={values.paymentSecondThird3060}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                />
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
                                            label="First payment (custom amount), then monthly payments for 11 months"
                                        />
                                        {Boolean(values.paymentOptionMonthly11) && (
                                            <Box pl={4} pt={1}>
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="Option 3 - First payment (monthly auto-adjust)"
                                                    name="paymentFirstMonthly11"
                                                    value={values.paymentFirstMonthly11}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                />
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
                                            label="First payment (custom amount), then 3 quarterly payments"
                                        />
                                        {Boolean(values.paymentOptionQuarterly3) && (
                                            <Box pl={4} pt={1}>
                                                <TextField
                                                    fullWidth
                                                    variant="filled"
                                                    type="number"
                                                    label="Option 4 - First payment (quarterly auto-adjust)"
                                                    name="paymentFirstQuarterly3"
                                                    value={values.paymentFirstQuarterly3}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                />
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
                        )}
                    </Formik>
                </Box>
            )}
        </Box>
    );
};

export default Costs;
