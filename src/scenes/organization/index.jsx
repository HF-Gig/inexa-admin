import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography,
    Snackbar,
    Alert,
    CircularProgress,
    Avatar,
} from "@mui/material";
import { Edit, Delete, Add, Visibility } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import { useToast } from "../../components/ToastProvider";
import CommonSearchBar from "../../components/CommonSearchBar";

const Organization = () => {
    const [organizations, setOrganizations] = useState([]);
    const [allOrganizations, setAllOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, orgId: null });
    const [sortCol, setSortCol] = useState("id");
    const [sortDir, setSortDir] = useState("desc");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [logoDialogOpen, setLogoDialogOpen] = useState(false);
    const [logoDialogUrl, setLogoDialogUrl] = useState("");

    useEffect(() => {
        fetchOwners(page, rowsPerPage, sortCol, sortDir);
    }, [page, rowsPerPage, sortCol, sortDir]);

    useEffect(() => {
        let sortedOrgs = [...allOrganizations];
        if (sortCol) {
            sortedOrgs.sort((a, b) => {
                const aVal = a[sortCol];
                const bVal = b[sortCol];
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
                } else {
                    const aStr = String(aVal || '').toLowerCase();
                    const bStr = String(bVal || '').toLowerCase();
                    return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
                }
            });
        }

        if (!search.trim()) {
            setOrganizations(sortedOrgs);
        } else {
            const filtered = sortedOrgs.filter(org =>
                org.organization_name?.toLowerCase().includes(search.toLowerCase())
            );
            setOrganizations(filtered);
        }
    }, [sortCol, sortDir, allOrganizations, search]);

    useEffect(() => {
        if (location.state?.toast) {
            showToast(location.state.toast);
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    const handleSortChange = (col, dir) => {
        setSortCol(col);
        setSortDir(dir);
        fetchOwners(page, rowsPerPage, col, dir);
    };

    const fetchOwners = async (page, rowsPerPage, col, dir, searchQuery = "") => {
        try {
            setLoading(true);
            let pageNum = 1;
            let allData = [];
            let hasMore = true;

            while (hasMore) {
                const res = await api.get(`/organization?page=${pageNum}&page_size=100&search=${searchQuery}`);
                if (res.status !== 200) throw new Error("Failed to fetch owners");

                const dataChunk = res.data.data || [];
                allData = [...allData, ...dataChunk];

                const pagination = res.data.pagination;
                hasMore = pagination && pageNum < pagination.totalPages;
                pageNum++;
            }

            setAllOrganizations(allData);
            setOrganizations(allData);
            setTotal(allData.length);
        } catch (error) {
            console.error(error);
            setSnackbar({
                open: true,
                message: "Failed to fetch owners. Please try again.",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOwner = async (orgId) => {
        try {
            await api.delete(`/organization/${orgId}`).then((res) => {
                if (res.status === 200) {
                    setSnackbar({ open: true, message: "Owner deleted successfully!", severity: "success" });
                    fetchOwners();
                }
            });
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to delete owner.", severity: "error" });
        }
    };

    const handleOpenDeleteDialog = (orgId) => {
        setConfirmDelete({ open: true, orgId });
    };

    const handleCloseDeleteDialog = () => {
        setConfirmDelete({ open: false, orgId: null });
    };

    const handleConfirmDelete = () => {
        handleDeleteOwner(confirmDelete.orgId);
        handleCloseDeleteDialog();
    };

    const tableColumns = [
        // { name: "id", label: "ID", width: 80 },
            { 
            name: "serial", 
            label: "ID", 
            width: 80,
            sortable: false,
            render: (row, index) => (page * rowsPerPage) + index + 1
        },
        {
            name: "organization_logo_image_url",
            label: "Logo",
            width: 80,
            render: (row) =>
                row.organization_logo_image_url ? (
                    <Avatar
                        src={row.organization_logo_image_url}
                        alt={row.organization_name}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                            console.log("Using image path:", row);
                            setLogoDialogUrl(row.organization_logo_image_url);
                            setLogoDialogOpen(true);
                        }}
                    />
                ) : (
                    <Avatar>{row.organization_name?.[0]}</Avatar>
                ),
        },
        { name: "organization_name", label: "Name", width: 180 },
    ];

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Paper elevation={4} sx={{ mx: "auto", boxShadow: "none", background: "#fff" }}>
                <Box sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">Universities</Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate("/organization/add")}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: 15,
                                px: 3,
                                py: 1.2,
                                boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.08)",
                                bgcolor: "primary.main",
                                '&:hover': { bgcolor: "primary.dark" }
                            }}
                        >
                            Add University
                        </Button>
                    </Box>
                    <Box mt={1} mb={2}>
                        <CommonSearchBar value={search} onChange={setSearch} placeholder="Search University..." sx={{ maxWidth: 350 }} />
                    </Box>
                </Box>
                <CommonTable
                    columns={tableColumns}
                    data={organizations.slice(page * rowsPerPage, (page + 1) * rowsPerPage)}
                    total={organizations.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    loading={loading}
                    onPageChange={setPage}
                    onRowsPerPageChange={e => setRowsPerPage(e?.target.value)}
                    actions={row => (
                        <Box display="flex" gap={1}>
                            <IconButton onClick={() => navigate(`/organization/view/${row.id}`)} title="View" sx={{ color: "primary.main", bgcolor: "primary.50", borderRadius: 1, "&:hover": { bgcolor: "primary.100" } }}>
                                <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => navigate(`/organization/edit/${row.id}`)} title="Edit" sx={{ color: "warning.main", bgcolor: "warning.50", borderRadius: 1, "&:hover": { bgcolor: "warning.100" } }}>
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton onClick={() => handleOpenDeleteDialog(row.id)} title="Delete" sx={{ color: "error.main", bgcolor: "error.50", borderRadius: 1, "&:hover": { bgcolor: "error.100" } }}>
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                    actionsWidth={80}
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                />
                <Dialog open={confirmDelete.open} onClose={handleCloseDeleteDialog} PaperProps={{ sx: { background: "#fff" } }}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>Are you sure you want to delete this univeristy?</DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteDialog} variant="outlined">Cancel</Button>
                        <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={logoDialogOpen} onClose={() => setLogoDialogOpen(false)} maxWidth="md">
                    {console.log("Using dialog image URL:", logoDialogUrl)}
                    <img
                        src={logoDialogUrl}
                        alt="Organization Logo"
                        style={{
                            maxWidth: "90vw",
                            maxHeight: "80vh",
                            display: "block",
                            margin: "auto",
                            borderRadius: 12,
                        }}
                    />
                </Dialog>
                <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
                </Snackbar>
            </Paper>
        </Box>
    );
};

export default Organization; 