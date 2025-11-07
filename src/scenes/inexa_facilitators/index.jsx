import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    Avatar,
    Link,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Snackbar,
    Alert,
    TextField,
    InputAdornment,
    useTheme,
} from "@mui/material";
import { Edit, Delete, Add, Visibility, Search, Clear } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import { useToast } from "../../components/ToastProvider";

const InexaFacilitators = () => {
    const [facilitators, setFacilitators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, facilitatorId: null });
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedBios, setExpandedBios] = useState({});
    const { showToast } = useToast();
    const theme = useTheme();

    useEffect(() => {
        fetchFacilitators();
    }, []);

    useEffect(() => {
        if (location.state?.toast) {
            showToast(location.state.toast);
            // Clear the state so it doesn't show again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location, showToast]);

    const fetchFacilitators = async () => {
        try {
            setLoading(true);
            const response = await api.get('/staff/inexa-staff/get-all');
            if (response.status !== 200) throw new Error("Failed to fetch facilitators");
            setFacilitators(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch facilitators:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFacilitator = async (facilitatorId) => {
        try {
            await api.delete(`/staff/inexa-staff/${facilitatorId}`).then((res) => {
                if (res.status === 200) {
                    setSnackbar({ open: true, message: "Facilitator deleted successfully!", severity: "success" });
                    fetchFacilitators();
                }
            });
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to delete facilitator.", severity: "error" });
        }
    };

    const handleOpenDeleteDialog = (facilitatorId) => {
        setConfirmDelete({ open: true, facilitatorId });
    };

    const handleCloseDeleteDialog = () => {
        setConfirmDelete({ open: false, facilitatorId: null });
    };

    const handleConfirmDelete = () => {
        handleDeleteFacilitator(confirmDelete.facilitatorId);
        handleCloseDeleteDialog();
    };

    const tableColumns = [
        {
            name: "profile_image_url",
            label: "",
            width: 80,
            render: (row) =>
                row.profile_image_url ? (
                    <Avatar
                        src={row.profile_image_url}
                        alt={`${row.first_name} ${row.last_name}`}
                        sx={{ width: 40, height: 40 }}
                    />
                ) : null,
        },
        { name: "first_name", label: "First Name", width: 150 },
        { name: "last_name", label: "Last Name", width: 150 },
        { name: "subject_expertise", label: "Subject", width: 180 },
        { name: "email", label: "Email", width: 200 },
        {
            name: "bio_info",
            label: "Bio Info",
            width: 250,
            render: (row) => {
                const bio = row.bio_info || '';
                const isExpanded = expandedBios[row.id];
                const displayText = isExpanded ? bio : bio.length > 100 ? bio.substring(0, 100) + '...' : bio;
                const showButton = bio.length > 100;
                return (
                    <Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {displayText}
                        </Typography>
                        {showButton && (
                            <Button
                                size="small"
                                onClick={() => setExpandedBios(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
                                sx={{ mt: 0.5, p: 0, minWidth: 'auto', fontSize: '0.75rem' }}
                            >
                                {isExpanded ? 'Show Less' : 'Show More'}
                            </Button>
                        )}
                    </Box>
                );
            },
        },
        {
            name: "social_links",
            label: "Social Media Links",
            width: 200,
            render: (row) => {
                if (!row.social_links) return null;
                const links = typeof row.social_links === 'object' ? row.social_links : JSON.parse(row.social_links || '{}');
                return (
                    <Box>
                        {Object.entries(links).map(([platform, url]) => (
                            <Link key={platform} href={url} target="_blank" rel="noopener" sx={{ mr: 1, display: 'inline-block' }}>
                                {platform}
                            </Link>
                        ))}
                    </Box>
                );
            },
        },
    ];

    const filteredFacilitators = facilitators.filter(fac => {
        const fullName = `${fac.first_name || ""} ${fac.last_name || ""}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Box sx={{ mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                        Inexa Facilitators
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate("/inexa-staff/add")}
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
                        Add Inexa Facilitator
                    </Button>
                </Box>
                <Box mt={1} mb={2}>
                    <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        placeholder="Search facilitators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            background: "#f5f7fa",
                            borderRadius: 2,
                            minHeight: 44,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                fontSize: 16,
                                paddingLeft: 1,
                                background: "#f5f7fa",
                                "& fieldset": {
                                    borderColor: "#e0e6ed",
                                },
                                "&:hover fieldset": {
                                    borderColor: theme.palette.primary.light,
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: theme.palette.primary.main,
                                    boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.08)",
                                },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: theme.palette.grey[600] }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setSearchTerm("")} size="small">
                                        <Clear fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
            </Box>
            <CommonTable
                columns={tableColumns}
                data={filteredFacilitators}
                total={facilitators.length}
                page={0}
                rowsPerPage={facilitators.length || 10}
                onPageChange={() => {}}
                onRowsPerPageChange={() => {}}
                loading={loading}
                actions={row => (
                    <Box display="flex" gap={1}>
                        <IconButton onClick={() => navigate(`/inexa-staff/view/${row.id}`)} title="View" sx={{ color: "primary.main", bgcolor: "primary.50", borderRadius: 1, "&:hover": { bgcolor: "primary.100" } }}>
                            <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => navigate(`/inexa-staff/edit/${row.id}`)} title="Edit" sx={{ color: "warning.main", bgcolor: "warning.50", borderRadius: 1, "&:hover": { bgcolor: "warning.100" } }}>
                            <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleOpenDeleteDialog(row.id)} title="Delete" sx={{ color: "error.main", bgcolor: "error.50", borderRadius: 1, "&:hover": { bgcolor: "error.100" } }}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Box>
                )}
                actionsWidth={150}
                sx={{ maxWidth: '100%' }}
            />
            <Dialog open={confirmDelete.open} onClose={handleCloseDeleteDialog} PaperProps={{ sx: { background: "#fff" } }}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>Are you sure you want to delete this facilitator?</DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} variant="outlined">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default InexaFacilitators;
