import { useEffect, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import api from "../../helpers/api";
import { Header } from "../../components";
import CommonTable from "../../components/CommonTable";

const emptyForm = {
  id: null,
  title: "",
  value: "",
  order: "",
  status: true,
};

const SiteStatistics = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState("order");
  const [sortDir, setSortDir] = useState("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/site-statistics?page=${page + 1}&page_size=${rowsPerPage}`
      );
      const data = Array.isArray(res.data?.data || res.data)
        ? res.data.data || res.data
        : [];
      // sort by order ascending, then id
      data.sort((a, b) => {
        if (a.order == null && b.order == null) return (a.id || 0) - (b.id || 0);
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });
      setStats(data);
    } catch (err) {
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const sortedStats = useMemo(() => {
    const normalizeNumber = (v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const compareNullable = (a, b, compareFn) => {
      const aNull = a === null || a === undefined;
      const bNull = b === null || b === undefined;
      if (aNull && bNull) return 0;
      if (aNull) return 1; // nulls last
      if (bNull) return -1;
      return compareFn(a, b);
    };

    const dirMul = sortDir === "asc" ? 1 : -1;

    return [...stats].sort((a, b) => {
      const tie = (a.id || 0) - (b.id || 0);
      switch (sortCol) {
        case "order": {
          const na = normalizeNumber(a.order);
          const nb = normalizeNumber(b.order);
          return dirMul * compareNullable(na, nb, (x, y) => x - y) || tie;
        }
        case "value": {
          const na = normalizeNumber(a.value);
          const nb = normalizeNumber(b.value);
          return dirMul * compareNullable(na, nb, (x, y) => x - y) || tie;
        }
        case "title": {
          const aTitle = a.title ?? null;
          const bTitle = b.title ?? null;
          return (
            dirMul *
              compareNullable(aTitle, bTitle, (x, y) =>
                String(x).localeCompare(String(y), undefined, {
                  sensitivity: "base",
                  numeric: true,
                })
              ) || tie
          );
        }
        case "status": {
          const sa = a.status ? 1 : 0;
          const sb = b.status ? 1 : 0;
          return dirMul * (sa - sb) || tie;
        }
        default: {
          const av = a?.[sortCol];
          const bv = b?.[sortCol];
          return dirMul * compareNullable(av, bv, (x, y) => String(x).localeCompare(String(y))) || tie;
        }
      }
    });
  }, [stats, sortCol, sortDir]);

  const startIndex = page * rowsPerPage;
  const tableData = useMemo(() => {
    const paged = sortedStats.slice(startIndex, startIndex + rowsPerPage);
    return paged.map((s, idx) => ({
      ...s,
      rowNumber: startIndex + idx + 1,
    }));
  }, [sortedStats, startIndex, rowsPerPage]);

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (stat) => {
    setForm({
      id: stat.id,
      title: stat.title || "",
      value: stat.value || "",
      order: stat.order ?? "",
      status: stat.status ?? true,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      value: form.value,
      order: form.order === "" ? null : Number(form.order),
      status: !!form.status,
    };

    try {
      if (form.id) {
        await api.put(`/site-statistics/${form.id}`, payload);
      } else {
        await api.post("/site-statistics", payload);
      }
      handleCloseDialog();
      fetchStats();
    } catch (err) {
      // optional: show toast
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/site-statistics/${deleteId}`);
      setDeleteId(null);
      fetchStats();
    } catch (err) {
      setDeleteId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Header
        title="Home Page"
        subtitle="Manage the statistics displayed on the public home page."
        action={
          <Button variant="contained" onClick={handleOpenAdd}>
            Add Statistic
          </Button>
        }
      />

      <CommonTable
        columns={[
          { name: "rowNumber", label: "No", width: 70, align: "center", sortable: false },
          { name: "order", label: "Order", align: "center", render: (row) => (row.order ?? "-")},
          { name: "title", label: "Title" },
          { name: "value", label: "Value", align: "center", render: (row) => (row.value ?? "-")},
          { name: "status", label: "Active", align: "center", render: (row) => (row.status ? "Yes" : "No")},
        ]}
        data={tableData.map((s) => ({
          ...s,
          order: s.order,
          value: s.value,
        }))}
        total={stats.length}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={loading}
        onPageChange={setPage}
        onRowsPerPageChange={(e) => {
          const value = Number(e?.target?.value || 10);
          setRowsPerPage(value);
          setPage(0);
        }}
        sortCol={sortCol}
        sortDir={sortDir}
        onSortChange={(colName, direction) => { setSortCol(colName); setSortDir(direction); setPage(0);}}
        actions={(row) => (
          <Box display="flex" gap={1}>
            <IconButton onClick={() => handleOpenEdit(row)} title="Edit">
              <Edit fontSize="small" sx={{ color: "#ff9800" }} />
            </IconButton>
            <IconButton
              onClick={() => setDeleteId(row.id)}
              title="Delete"
              sx={{ color: "#f44336" }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 8px 32px rgba(40,40,40,0.18)",
            p: { xs: 1, sm: 3 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: 26,
            color: "#3322FF",
            pb: 2,
            letterSpacing: 1,
            textAlign: "center",
          }}
        >
          {form.id ? "Edit Statistic" : "Add Statistic"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <TextField
            label="Value (number displayed)"
            fullWidth
            margin="normal"
            value={form.value}
            onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
          />
          <TextField
            label="Order (1 = first, 2 = second...)"
            fullWidth
            margin="normal"
            type="number"
            value={form.order}
            onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.checked }))
                }
              />
            }
            label="Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              borderColor: "#3322FF",
              color: "#3322FF",
              fontWeight: 700,
              borderRadius: 3,
              px: 3,
              py: 1,
              fontSize: 16,
              "&:hover": {
                background: "#F0F4FF",
                borderColor: "#3322FF",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!form.title || !form.value}
            sx={{
              background: "#3322FF",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 3,
              px: 3,
              py: 1,
              fontSize: 16,
              boxShadow: "0 2px 8px rgba(51,34,255,0.08)",
              "&:hover": {
                background: "#2211AA",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Statistic</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this statistic?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiteStatistics;

