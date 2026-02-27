import { Box, Button, TextField, MenuItem, Select, InputLabel, FormControl, Typography, useTheme } from "@mui/material";
import { Formik } from "formik";
import * as Yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useState } from "react";
import api from "../../helpers/api";

const Costs = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const response = await api.post("/costs/update", values);
            if (response.data && response.data.success) {
                setSuccessMessage(response.data.message);
                // We do typically reset form if the user wants to enter new values, 
                // ensuring fields are empty as requested.
                resetForm();
            } else {
                setErrorMessage("Failed to update costs.");
            }
        } catch (error) {
            console.error("Update error", error);
            setErrorMessage(error.response?.data?.error || "An error occurred while updating costs.");
        } finally {
            setSubmitting(false);
        }
    };

    const initialValues = {
        providerId: 1,
        interactiveCost: "",
        selfCost: "",
        interactiveCaption: "",
        selfCaption: "",
        paymentTypeSelf: "",
        paymentTypeInteractive: "",
    };

    const checkoutSchema = Yup.object().shape({
        providerId: Yup.number().required("Provider is required"),
        interactiveCost: Yup.number().typeError("Must be a number").nullable(),
        selfCost: Yup.number().typeError("Must be a number").nullable(),
        interactiveCaption: Yup.string().nullable(),
        selfCaption: Yup.string().nullable(),
        paymentTypeSelf: Yup.string().nullable(),
        paymentTypeInteractive: Yup.string().nullable(),
    });

    return (
        <Box m="20px">
            <Header title="COSTS" subtitle="Update Course Costs by Provider" />

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

            <Formik
                onSubmit={handleFormSubmit}
                initialValues={initialValues}
                validationSchema={checkoutSchema}
            >
                {({
                    values,
                    errors,
                    touched,
                    handleBlur,
                    handleChange,
                    handleSubmit,
                    isSubmitting,
                }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            display="grid"
                            gap="30px"
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

                            <TextField
                                fullWidth
                                variant="filled"
                                type="number"
                                label="Interactive Cost"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.interactiveCost}
                                name="interactiveCost"
                                error={!!touched.interactiveCost && !!errors.interactiveCost}
                                helperText={touched.interactiveCost && errors.interactiveCost}
                                sx={{ gridColumn: "span 2" }}
                            />
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
                                type="number"
                                label="Self Cost"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.selfCost}
                                name="selfCost"
                                error={!!touched.selfCost && !!errors.selfCost}
                                helperText={touched.selfCost && errors.selfCost}
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
                        <Box display="flex" justifyContent="end" mt="20px">
                            <Button type="submit" color="secondary" variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? "Updating..." : "Update Costs"}
                            </Button>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default Costs;
