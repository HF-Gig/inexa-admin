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
  Checkbox,
} from "@mui/material";
import { Edit, Delete, Add, Visibility } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import { useToast } from "../../components/ToastProvider";
import CommonSearchBar from "../../components/CommonSearchBar";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, providerId: null });
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [logoDialogUrl, setLogoDialogUrl] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchProviders(page, rowsPerPage, sortCol, sortDir, debouncedSearch);
  }, [page, rowsPerPage, sortCol, sortDir, debouncedSearch]);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location, showToast]);

  const handleSortChange = (col, dir) => {
    setSortCol(col);
    setSortDir(dir);
    fetchProviders(page, rowsPerPage, col, dir, debouncedSearch);
  };

  const fetchProviders = async (pageArg = page, rowsPerPageArg = rowsPerPage, sortColArg = sortCol, sortDirArg = sortDir, searchArg = debouncedSearch) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/course-providers?page=${pageArg + 1}&limit=${rowsPerPageArg}&sortBy=${sortColArg}&order=${sortDirArg}&search=${encodeURIComponent(searchArg)}`
      );
      if (response.status !== 200) throw new Error("Failed to fetch providers");
      console.log("Providers fetched:", response.data.providers);
      setProviders(response.data.providers || []);
      setTotal(response.data.pagination?.totalItems || 0);
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to fetch providers. Please try again.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (providerId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/course-providers/${providerId}`, { status: newStatus });
      setSnackbar({ open: true, message: "Provider status updated successfully!", severity: "success" });
      fetchProviders();
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to update provider status.", severity: "error" });
    }
  };

  const handleDeleteProvider = async (providerId) => {
    try {
      await api.delete(`/course-providers/${providerId}`).then((res) => {
        if (res.status === 200) {
          setSnackbar({ open: true, message: "Provider deleted successfully!", severity: "success" });
          fetchProviders();
        }
      });
    } catch (error) {
      setSnackbar({ open: true, message: "Failed to delete provider.", severity: "error" });
    }
  };

  const handleOpenDeleteDialog = (providerId) => {
    setConfirmDelete({ open: true, providerId });
  };

  const handleCloseDeleteDialog = () => {
    setConfirmDelete({ open: false, providerId: null });
  };

  const handleConfirmDelete = () => {
    handleDeleteProvider(confirmDelete.providerId);
    handleCloseDeleteDialog();
  };

  const tableColumns = [
    { name: "id", label: "ID", width: 80 },
    {
      name: "logo_url",
      label: "Logo",
      width: 80,
      render: (row) =>
        row.logo_url ? (
          <Avatar
            src={`${import.meta.env.VITE_API_URL}${row.logo_url}`}
            alt={row.name}
            sx={{
              cursor: "pointer",
              '& img': {
                objectFit: 'contain',
                width: '100%',
                height: '100%'
              }
            }}
            onClick={() => {
              setLogoDialogUrl(row.logo_url);
              setLogoDialogOpen(true);
            }}
          />
        ) : (
          <Avatar>{row.name?.[0]}</Avatar>
        ),
    },
    { name: "name", label: "Name", width: 180 },
    { name: "slug", label: "Slug", width: 180 },
    {
      name: "status",
      label: "Status",
      width: 100,
      render: (row) => (
        <Checkbox
          checked={row.status}
          onChange={() => handleToggleStatus(row.id, row.status)}
          color="primary"
        />
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Paper elevation={4} sx={{ mx: "auto", boxShadow: "none", background: "#fff" }}>
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
            <Typography variant="h4" fontWeight={700} color="primary.main">Providers</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/providers/add")}
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
              Add Provider
            </Button>
          </Box>
          <Box mt={1} mb={2}>
            <CommonSearchBar value={search} onChange={setSearch} placeholder="Search providers..." sx={{ maxWidth: 350 }} />
          </Box>
        </Box>
        <CommonTable
          columns={tableColumns}
          data={providers}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onPageChange={setPage}
          onRowsPerPageChange={e => setRowsPerPage(e?.target.value)}
          actions={row => (
            <Box display="flex" gap={1}>
              <IconButton onClick={() => navigate(`/providers/view/${row.id}`)} title="View" sx={{ color: "primary.main", bgcolor: "primary.50", borderRadius: 1, "&:hover": { bgcolor: "primary.100" } }}>
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton onClick={() => navigate(`/providers/edit/${row.id}`)} title="Edit" sx={{ color: "warning.main", bgcolor: "warning.50", borderRadius: 1, "&:hover": { bgcolor: "warning.100" } }}>
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
          <DialogContent>Are you sure you want to delete this provider?</DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} variant="outlined">Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={logoDialogOpen} onClose={() => setLogoDialogOpen(false)} maxWidth="md">
          <img
            src={logoDialogUrl}
            alt="Provider Logo"
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

export default Providers;
