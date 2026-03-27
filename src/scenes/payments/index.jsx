import React, { useState, useEffect } from "react";
import { Box, Typography, Chip, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { CheckCircle, Cancel, AccessTime, Delete, Refresh } from "@mui/icons-material";
import { Header } from "../../components";
import CommonTable from "../../components/CommonTable";
import api from "../../helpers/api";

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState("");

    const fetchPayments = async (pageNum, pageSize, searchQuery = "", dateQuery = "", statusQuery = "") => {
        try {
            setLoading(true);
            let url = `/payment/all?page=${pageNum + 1}&limit=${pageSize}`;
            if (searchQuery) url += `&search=${searchQuery}`;
            if (dateQuery) url += `&date=${dateQuery}`;
            if (statusQuery) url += `&status=${statusQuery}`;

            const response = await api.get(url);
            if (response.data.success) {
                setPayments(response.data.data);
                setTotal(response.data.pagination.totalHelpers);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments(page, rowsPerPage, search, date, status);
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [page, rowsPerPage, search, date, status]);

    const handleStatusUpdate = async (paymentId, status) => {
        if (!window.confirm(`Are you sure you want to mark this payment as ${status}?`)) return;

        try {
            await api.put(`/payment/${paymentId}/status`, { status });
            fetchPayments(page, rowsPerPage, search, date, status);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (paymentId) => {
        if (!window.confirm("Are you sure you want to delete this payment? This action cannot be undone.")) return;

        try {
            await api.delete(`/payment/${paymentId}`);
            fetchPayments(page, rowsPerPage, search, date, status);
        } catch (error) {
            console.error("Error deleting payment:", error);
            alert("Failed to delete payment");
        }
    };

    const getStatusChip = (status) => {
        const statusMap = {
            initiated: { color: "warning", label: "Initiated", icon: <AccessTime /> },
            pending: { color: "info", label: "Pending", icon: <AccessTime /> },
            succeeded: { color: "success", label: "Succeeded", icon: <CheckCircle /> },
            sent: { color: "secondary", label: "Payment Sent", icon: <AccessTime /> },
            failed: { color: "error", label: "Failed", icon: <Cancel /> },
            declined: { color: "error", label: "Declined", icon: <Cancel /> },
            cancelled: { color: "default", label: "Cancelled", icon: <Cancel /> },
        };

        const config = statusMap[status] || { color: "default", label: status };

        return (
            <Chip
                label={config.label}
                color={config.color}
                size="small"
                variant="outlined"
                icon={config.icon}
            />
        );
    };

    const columns = [
        { name: "id", label: "ID/Reference", width: 50 },
        {
            name: "user",
            label: "User",
            align: "left",
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {row.user ? `${row.user.first_name} ${row.user.last_name}` : "Unknown"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {row.user?.email}
                    </Typography>
                </Box>
            ),
        },
        {
            name: "course",
            label: "Course",
            render: (row) => (
                <Typography variant="body2">
                    {row.course ? row.course.title : "N/A"}
                </Typography>
            ),
        },
        {
            name: "amount",
            label: "Amount",
            render: (row) => (
                <Typography fontWeight="500">
                    {row.currency?.toUpperCase()} {row.amount}
                </Typography>
            ),
        },
        {
            name: "payment_type",
            label: "Type",
            render: (row) => (
                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {row.payment_type}
                </Typography>
            ),
        },
        {
            name: "payment_method",
            label: "Method",
            render: (row) => (
                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {row.payment_method || "N/A"}
                </Typography>
            ),
        },
        {
            name: "selected_plan",
            label: "Plan",
            render: (row) => (
                <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {row.selected_plan || "N/A"}
                </Typography>
            ),
        },
        {
            name: "installment",
            label: "Installment",
            render: (row) => (
                <Typography variant="body2">
                    {row.installment_label || "N/A"}{" "}
                    {row.installment_number && row.total_installments ? `(${row.installment_number}/${row.total_installments})` : ""}
                </Typography>
            ),
        },
        {
            name: "due_date",
            label: "Due Date",
            render: (row) => (
                <Typography variant="body2">
                    {row.due_date ? new Date(row.due_date).toLocaleDateString() : "N/A"}
                </Typography>
            ),
        },
        {
            name: "status",
            label: "Status",
            render: (row) => getStatusChip(row.status),
        },
        {
            name: "created_at",
            label: "Date",
            render: (row) => (
                <Box>
                    <Typography variant="body2">
                        {new Date(row.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {new Date(row.created_at).toLocaleTimeString()}
                    </Typography>
                </Box>
            ),
        },
    ];

    return (
        <Box m="20px">
            <Header title="Payments" subtitle="Manage and track all system payments" />

            <Box mt={3} display="flex" gap={2} flexWrap="wrap">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        minWidth: "250px",
                        outline: "none"
                    }}
                />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        outline: "none"
                    }}
                />
                {date && (
                    <button
                        onClick={() => setDate("")}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#eee",
                            cursor: "pointer",
                            fontSize: "12px",
                            alignSelf: "center"
                        }}
                    >
                        Clear Date
                    </button>
                )}
                <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                        labelId="status-select-label"
                        id="status-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        label="Status"
                        sx={{ height: '40px', backgroundColor: 'white' }}
                    >
                        <MenuItem value="">
                            <em>All</em>
                        </MenuItem>
                        <MenuItem value="initiated">Initiated</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="succeeded">Succeeded</MenuItem>
                        <MenuItem value="sent">Payment Sent</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="declined">Declined</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                </FormControl>
                {status && (
                    <button
                        onClick={() => setStatus("")}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#eee",
                            cursor: "pointer",
                            fontSize: "12px",
                            alignSelf: "center"
                        }}
                    >
                        Clear Status
                    </button>
                )}
                <button
                    onClick={() => fetchPayments(page, rowsPerPage, search, date, status)}
                    style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#3322ff",
                        cursor: "pointer",
                        fontSize: "12px",
                        alignSelf: "center",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px"
                    }}
                >
                    <Refresh /> Refresh
                </button>
            </Box>

            <Box mt="20px">
                <CommonTable
                    columns={columns}
                    data={payments}
                    total={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    loading={loading}
                    actions={(row) => (
                        <Box display="flex" justifyContent="center">
                            <Tooltip title="Approve">
                                <span>
                                    <IconButton
                                        onClick={() => handleStatusUpdate(row.id, "succeeded")}
                                        disabled={row.status === "succeeded"}
                                        color="success"
                                    >
                                        <CheckCircle />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Decline">
                                <span>
                                    <IconButton
                                        onClick={() => handleStatusUpdate(row.id, "declined")}
                                        disabled={row.status === "declined" || row.status === "cancelled"}
                                        color="error"
                                    >
                                        <Cancel />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <span>
                                    <IconButton
                                        onClick={() => handleDelete(row.id)}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    )}
                />
            </Box>
        </Box>
    );
};

export default Payments;
