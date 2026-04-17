import {
    Box,
    Button,
    TextField,
    Typography,
    useTheme,
    IconButton,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { Formik } from "formik";
import * as Yup from "yup";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { useEffect, useState } from "react";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import dayjs from "dayjs";

const Coupons = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRows = async () => {
        try {
            setLoading(true);
            const response = await api.get("/coupons");
            setRows(response.data?.data || []);
        } catch (error) {
            console.error("Fetch coupons error", error);
            setErrorMessage("Failed to load coupons.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRows();
    }, []);

    const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
        setSuccessMessage("");
        setErrorMessage("");

        try {
            if (editingRow) {
                await api.put(`/coupons/${editingRow.id}`, values);
                setSuccessMessage("Coupon updated successfully.");
            } else {
                await api.post("/coupons", values);
                setSuccessMessage("Coupon created successfully.");
            }
            fetchRows();
            resetForm();
            setIsCreateMode(false);
            setEditingRow(null);
        } catch (error) {
            console.error("Update error", error);
            setErrorMessage(error.response?.data?.error || "An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (row) => {
        setEditingRow(row);
        setIsCreateMode(true);
    };

    const handleDelete = async (row) => {
        const ok = window.confirm("Are you sure you want to delete this coupon?");
        if (!ok) return;
        try {
            await api.delete(`/coupons/${row.id}`);
            setSuccessMessage("Coupon deleted successfully.");
            fetchRows();
        } catch (error) {
            console.error("Delete coupon error", error);
            setErrorMessage("Failed to delete coupon.");
        }
    };

    const initialValues = {
        code: editingRow?.code ?? "",
        percentage: editingRow?.percentage ?? "",
        expiryDate: editingRow?.expiryDate ? new Date(editingRow.expiryDate).toISOString().split('T')[0] : "",
    };

    const checkoutSchema = Yup.object().shape({
        code: Yup.string().required("Code is required"),
        percentage: Yup.number().required("Percentage is required").min(0).max(100),
        expiryDate: Yup.date().nullable(),
    });

    return (
        <Box m="20px">
            <Header
                title="COUPONS"
                action={
                    !isCreateMode ? (
                        <Button variant="contained" color="secondary" onClick={() => setIsCreateMode(true)}>
                            Create
                        </Button>
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
                <>
                    <Box mt={1} mb={2}>
                        <TextField
                            fullWidth
                            size="small"
                            variant="outlined"
                            placeholder="Search coupons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                background: "#f5f7fa",
                                borderRadius: 2,
                                minHeight: 44,
                                maxWidth: 350,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    fontSize: 16,
                                    paddingLeft: 1,
                                    background: "#f5f7fa",
                                    "& fieldset": {
                                        borderColor: "#e0e6ed",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "#1976d2",
                                    },
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#1976d2",
                                        boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.08)",
                                    },
                                },
                            }}
                        />
                    </Box>
                    <CommonTable
                        columns={[
                            {
                                name: "no",
                                label: "No.",
                                render: (row, idx) => idx + 1
                            },
                            { name: "code", label: "Coupon Code" },
                            { name: "percentage", label: "Percentage (%)" },
                            {
                                name: "expiryDate",
                                label: "Expiry Date",
                                render: (row) => row.expiryDate ? dayjs(row.expiryDate).format("DD/MM/YYYY") : "No Expiry"
                            },
                        ]}
                        data={rows.filter(row =>
                            row.code?.toLowerCase().includes(searchTerm.toLowerCase())
                        )}
                        total={rows.filter(row =>
                            row.code?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length}
                        page={0}
                        rowsPerPage={rows.length || 10}
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
                </>
            ) : (
                <Box mt="20px" p="20px" border="1px solid #ddd" borderRadius="8px">
                    <Typography variant="h5" mb="20px">{editingRow ? "Edit Coupon" : "Create Coupon"}</Typography>
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
                            isSubmitting,
                        }) => (
                            <form onSubmit={handleSubmit}>
                                <Box display="grid" gap="20px" gridTemplateColumns="repeat(2, 1fr)">
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        label="Coupon Code"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.code}
                                        name="code"
                                        error={!!touched.code && !!errors.code}
                                        helperText={touched.code && errors.code}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="number"
                                        label="Percentage Applied (%)"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.percentage}
                                        name="percentage"
                                        error={!!touched.percentage && !!errors.percentage}
                                        helperText={touched.percentage && errors.percentage}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="date"
                                        label="Expiry Date"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.expiryDate}
                                        name="expiryDate"
                                        InputLabelProps={{ shrink: true }}
                                        error={!!touched.expiryDate && !!errors.expiryDate}
                                        helperText={touched.expiryDate && errors.expiryDate}
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

export default Coupons;
