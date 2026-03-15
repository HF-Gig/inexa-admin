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
    TableCell,
    Avatar,
} from "@mui/material";
import { Edit, Delete, Add, Visibility } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import { useToast } from "../../components/ToastProvider";
import SchoolIcon from '@mui/icons-material/School'; // or LibraryBooks, MenuBook, etc.
import CommonSearchBar from "../../components/CommonSearchBar";

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, staffId: null });
    const [sortCol, setSortCol] = useState("id"); // default sort column
    const [sortDir, setSortDir] = useState("desc"); // default sort direction
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [photoDialogUrl, setPhotoDialogUrl] = useState("");

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        fetchStaff(page, rowsPerPage, sortCol, sortDir, debouncedSearch);
        // eslint-disable-next-line
    }, [page, rowsPerPage, sortCol, sortDir, debouncedSearch]);

    useEffect(() => {
        if (location.state?.toast) {
            showToast(location.state.toast);
            // Clear the state so it doesn't show again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    const handleSortChange = (col, dir) => {
        setSortCol(col);
        setSortDir(dir);
        fetchStaff(page, rowsPerPage, col, dir, debouncedSearch);
    };

    const fetchStaff = async (pageArg = page, rowsPerPageArg = rowsPerPage, sortColArg = sortCol, sortDirArg = sortDir, searchArg = debouncedSearch) => {
        try {
            setLoading(true);
            const response = await api.get(
                `/staff?page=${pageArg + 1}&page_size=${rowsPerPageArg}&sortCol=${sortColArg}&sortDir=${sortDirArg}&search=${encodeURIComponent(searchArg)}`
            );
            console.log("Data fetched for all satff: ", response.data.data);
            if (response.status !== 200) throw new Error("Failed to fetch staff");
            setStaff(response.data.data || []);
            setTotal(response.data.pagination?.totalItems || 0);
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to fetch staff. Please try again.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        try {
            await api.delete(`/staff/${staffId}`).then((res) => {
                if (res.status === 200) {
                    setSnackbar({ open: true, message: "Staff deleted successfully!", severity: "success" });
                    fetchStaff();
                }
            });
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to delete staff.", severity: "error" });
        }
    };

    const handleOpenDeleteDialog = (staffId) => {
        setConfirmDelete({ open: true, staffId });
    };

    const handleCloseDeleteDialog = () => {
        setConfirmDelete({ open: false, staffId: null });
    };

    const handleConfirmDelete = () => {
        handleDeleteStaff(confirmDelete.staffId);
        handleCloseDeleteDialog();
    };

    const tableColumns = [
        { name: "id", label: "ID", width: 80 },
        {
            name: "profile_image_url",
            label: "Photo",
            width: 80,
            render: (row) =>
                row.profile_image_url ? (
                    <Avatar
                        src={row.profile_image_url}
                        alt={row.given_name}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                            setPhotoDialogUrl(row.profile_image_url);
                            setPhotoDialogOpen(true);
                        }}
                    />
                ) : (
                    <Avatar>{row.given_name?.[0]}</Avatar>
                ),
        },
        { name: "given_name", label: "Given Name", width: 150 },
        { name: "family_name", label: "Family Name", width: 150 },
        { name: "position_title", label: "Position Title", width: 180 },
        { name: "organization_name", label: "Organization", width: 120 },
    ];

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Paper elevation={4} sx={{ mx: "auto", boxShadow: "none", background: "#fff" }}>
                <Box sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">Instructors</Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate("/staff/add")}
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
                            Add Instructor
                        </Button>
                    </Box>
                    <Box mt={1} mb={2}>
                        <CommonSearchBar value={search} onChange={setSearch} placeholder="Search staff..." sx={{ maxWidth: 350 }} />
                    </Box>
                </Box>
                <CommonTable
                    columns={tableColumns}
                    data={staff}
                    total={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    loading={loading}
                    onPageChange={setPage}
                    onRowsPerPageChange={e => setRowsPerPage(e?.target.value)}
                    actions={row => (
                        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Box display="flex" gap={1}>
                                <IconButton onClick={() => navigate(`/staff/view/${row.id}`)} title="View" sx={{ color: "primary.main", bgcolor: "primary.50", borderRadius: 1, "&:hover": { bgcolor: "primary.100" } }}>
                                    <Visibility fontSize="small" />
                                </IconButton>
                                <IconButton onClick={() => navigate(`/staff/edit/${row.id}`)} title="Edit" sx={{ color: "warning.main", bgcolor: "warning.50", borderRadius: 1, "&:hover": { bgcolor: "warning.100" } }}>
                                    <Edit fontSize="small" />
                                </IconButton>
                                <IconButton onClick={() => handleOpenDeleteDialog(row.id)} title="Delete" sx={{ color: "error.main", bgcolor: "error.50", borderRadius: 1, "&:hover": { bgcolor: "error.100" } }}>
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box mt={1}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => navigate(`/staff/${row.id}/manage-courses`)}
                                    sx={{ fontWeight: 600, textTransform: 'none', bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, minWidth: 140 }}
                                >
                                    Manage Courses
                                </Button>
                            </Box>
                        </Box>
                    )}
                    actionsWidth={200}
                    sortCol={sortCol}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                />
                <Dialog open={confirmDelete.open} onClose={handleCloseDeleteDialog} PaperProps={{ sx: { background: "#fff" } }}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>Are you sure you want to delete this staff member?</DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteDialog} variant="outlined">Cancel</Button>
                        <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="md">
                    <img
                        src={photoDialogUrl}
                        alt="Staff"
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

export default Staff; 