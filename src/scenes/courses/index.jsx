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
  TextField,
  Typography,
  Alert,
  MenuItem,
  Snackbar,
  Checkbox,
} from "@mui/material";
import { Edit, Delete, Add, School, Visibility, Download } from "@mui/icons-material";
import * as Yup from "yup";
import api from "../../helpers/api";
import CommonTable from "../../components/CommonTable";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import CommonSearchBar from "../../components/CommonSearchBar";
import CommonDateRangeSelect from "../../components/CommonDateRangeSelect";

const formatLocalYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Mock course data
const mockCourses = [
  {
    id: 1,
    title: "React Fundamentals",
    instructor: "John Doe",
    category: "Programming",
    duration: "8 weeks",
    price: 299.99,
    status: "active",
    students: 45,
    rating: 4.5,
  },
  {
    id: 2,
    title: "Advanced JavaScript",
    instructor: "Jane Smith",
    category: "Programming",
    duration: "10 weeks",
    price: 399.99,
    status: "active",
    students: 32,
    rating: 4.8,
  },
  {
    id: 3,
    title: "UI/UX Design Principles",
    instructor: "Mike Johnson",
    category: "Design",
    duration: "6 weeks",
    price: 249.99,
    status: "draft",
    students: 18,
    rating: 4.2,
  },
  {
    id: 4,
    title: "Data Science Basics",
    instructor: "Sarah Wilson",
    category: "Data Science",
    duration: "12 weeks",
    price: 599.99,
    status: "active",
    students: 67,
    rating: 4.7,
  },
  {
    id: 5,
    title: "Mobile App Development",
    instructor: "David Brown",
    category: "Programming",
    duration: "14 weeks",
    price: 499.99,
    status: "inactive",
    students: 23,
    rating: 4.3,
  },
];

// Validation schema
const CourseSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .required("Title is required"),
  instructor: Yup.string()
    .min(2, "Instructor name must be at least 2 characters")
    .required("Instructor is required"),
  category: Yup.string()
    .oneOf(["Programming", "Design", "Data Science", "Business", "Marketing"], "Invalid category")
    .required("Category is required"),
  duration: Yup.string()
    .matches(/^\d+\s+weeks?$/, "Duration must be in format 'X weeks'")
    .required("Duration is required"),
  price: Yup.number()
    .min(0, "Price must be positive")
    .max(9999, "Price must be less than 9999")
    .required("Price is required"),
  status: Yup.string()
    .oneOf(["active", "inactive", "draft"], "Invalid status")
    .required("Status is required"),
  students: Yup.number()
    .min(0, "Students count must be positive")
    .required("Students count is required"),
  rating: Yup.number()
    .min(0, "Rating must be positive")
    .max(5, "Rating must be between 0 and 5")
    .required("Rating is required"),
});

const Courses = ({ pageType = 'courses' }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    courseId: null,
  });
  const [viewingCourse, setViewingCourse] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [createdAtRange, setCreatedAtRange] = useState(undefined);
  const [updatedAtRange, setUpdatedAtRange] = useState(undefined);
  const [universities, setUniversities] = useState([]);
  const [types, setTypes] = useState([]);

  const isProgram = pageType === 'programs' ? true : false;
  const navigatePage = isProgram ? '/programs' : '/courses';

  const getCurrentUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userInfo?.role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [ page, rowsPerPage, sortCol, sortDir, debouncedSearch, universityFilter, typeFilter, createdAtRange, updatedAtRange, location, pageType,]);

  useEffect(() => {
    fetchUniversities();
    fetchTypes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setPage(0);
  }, [universityFilter, typeFilter, createdAtRange, updatedAtRange]);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast);
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, showToast]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Map frontend column names to backend field names for sorting
      let backendSortCol = sortCol;
      if (sortCol === 'owner') backendSortCol = 'owners';
      if (sortCol === 'type') backendSortCol = 'type_id';
      if (sortCol === 'rowNumber') backendSortCol = 'id';
      const contentTypeMap = {
        courses: 'courses',
        programs: 'program',
      };

      const params = new URLSearchParams({
        page: (page + 1).toString(),
        page_size: rowsPerPage.toString(),
        sortCol: backendSortCol,
        sortDir,
        content_type: contentTypeMap[pageType] || 'both',
        search: debouncedSearch,
      });
      if (universityFilter) params.append('owners', universityFilter);
      if (typeFilter) params.append('program_type_slug', typeFilter);
      if (createdAtRange?.from) {
        params.append("created_from", formatLocalYmd(createdAtRange.from));
      }
      if (createdAtRange?.to) {
        params.append("created_to", formatLocalYmd(createdAtRange.to));
      }
      if (updatedAtRange?.from) {
        params.append("updated_from", formatLocalYmd(updatedAtRange.from));
      }
      if (updatedAtRange?.to) {
        params.append("updated_to", formatLocalYmd(updatedAtRange.to));
      }
      const response = await api.get(`/courses?${params.toString()}`);
      console.log(`${pageType === 'programs' ? 'Programs' : 'Courses'} fetched: `, response.data);
      if (response.status !== 200) throw new Error('Failed to fetch courses');
      setCourses(response.data.data || []);
      setTotal(response.data?.pagination?.totalItems || 0);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to fetch courses. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const response = await api.get('/owners');
      if (response.status === 200) {
        setUniversities(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch universities:', error);
    }
  };

  const fetchTypes = async () => {
    try {
      // Returns program types as: { id, name, slug }
      const response = await api.get('/courses/filters');
      if (response.status === 200) {
        setTypes(response.data?.program_types || []);
      }
    } catch (error) {
      console.error('Failed to fetch program types:', error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await api.delete(`/courses/${courseId}`).then((res) => {
        if (res.status === 200) {
          setSnackbar({
            open: true,
            message: `${isProgram ? 'Program' : 'Course'} deleted successfully!`,
            severity: "success",
          });
          fetchCourses();
        }
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete course.",
        severity: "error",
      });
    }
  };

  const handleOpenDeleteDialog = (courseId) => {
    setConfirmDelete({ open: true, courseId });
  };

  const handleCloseDeleteDialog = () => {
    setConfirmDelete({ open: false, courseId: null });
  };

  const handleConfirmDelete = () => {
    handleDeleteCourse(confirmDelete.courseId);
    handleCloseDeleteDialog();
  };

  const handleStatusToggle = async (course, checked) => {
    try {
      await api.post(`/courses/${course.id}`, { status: checked ? 1 : 0 });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, status: checked ? 1 : 0 } : c));
      showToast('Status updated');
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/courses/export-csv', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'courses_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: "Export successful!",
        severity: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: "Failed to export courses.",
        severity: "error",
      });
    }
  };

  const getTypeInfo = (typeId) => {
    switch (typeId) {
      case 6:
        return { name: "Course", bgColor: "#CCDD00", textColor: "#282828" };
      case 5:
        return { name: "Degree", bgColor: "#282828", textColor: "#FFFFFF" };
      case 4:
        return { name: "XSeries", bgColor: "#282828", textColor: "#FFFFFF" };
      case 2:
        return { name: "Professional Certificate", bgColor: "#3322FF", textColor: "#FFFFFF" };
      case 3:
        return { name: "MicroMasters®", bgColor: "#6644FF", textColor: "#FFFFFF" };
      case 1:
        return { name: "MicroBachelors®", bgColor: "#D4D4D4", textColor: "#282828" };
      default:
        return { name: "Unknown", bgColor: "#282828", textColor: "#FFFFFF" };
    }
  };

  // Table columns for CommonTable
  const tableColumns = [
    { name: "rowNumber", label: "No.", width: 80 },
    { name: "title", label: "Title", width: 200, align: "left" },
    {
      name: "type", label: "Type", width: 150, render: (row) => {
        const typeInfo = getTypeInfo(row.type_id);
        const displayName = row.program_type_name || typeInfo.name;
        return (
          <Box
            sx={{
              backgroundColor: typeInfo.bgColor,
              color: typeInfo.textColor,
              paddingRight: 4,
              paddingLeft: 4,
              paddingTop: 1,
              paddingBottom: 1,
              borderRadius: '40px',
              fontSize: '12px',
              fontWeight: 'bold',
              maxWidth: 'fit-content',
              textAlign: 'center',
            }}
          >
            {displayName}
          </Box>
        );
      }
    },
    { name: "start_date", label: "Start Date", width: 120 },
    { name: "owner", label: "University", width: 150 },
    { name: "weeks_to_complete", label: "Duration", width: 80 },
    { name: "createdAt", label: "Created At", width: "fit-content" },
    { name: "updatedAt", label: "Updated At", width: "fit-content" },
    { name: "pacing_type", label: "Pacing Type", width: 120 },
    { name: "status", label: "Active", width: 80, sortable: false, render: (row) => <Checkbox checked={row.status === 1} onChange={(e) => handleStatusToggle(row, e.target.checked)} /> },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 1200,
          mx: "auto",
          boxShadow: "none",
          background: "#fff",
        }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          mb={3}
          gap={2}
        >
          <Typography variant="h4" fontWeight={700} color="primary.main">
            {pageType === 'courses' ? 'Courses' : 'Programmes'}
          </Typography>
          <Box display="flex" gap={2}>
            {getCurrentUserRole() !== 'moderator' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate(navigatePage + "/add")}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 14,
                  px: 2,
                  py: 1,
                  boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.08)",
                }}
              >
                Add {pageType === "courses" ? "Course" : "Programme"}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportCsv}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                fontSize: 14,
                px: 2,
                py: 1,
              }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
        <Box mt={1} mb={2}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <CommonSearchBar
              value={search}
              onChange={setSearch}
              placeholder={`Search ${pageType === 'courses' ? 'courses' : 'programmes'}...`}
              sx={{ maxWidth: 350, flex: "1 1 250px" }}
            />
            <TextField
              select
              label="Program Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="">
                All Program Types
              </MenuItem>
              {types.map((t) => (
                <MenuItem key={t.id} value={t.slug}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <CommonDateRangeSelect
              label="Created"
              value={createdAtRange}
              onChange={setCreatedAtRange}
              minWidth={240}
              sx={{ flex: "0 1 260px", maxWidth: 260 }}
            />
            <CommonDateRangeSelect
              label="Updated"
              value={updatedAtRange}
              onChange={setUpdatedAtRange}
              minWidth={240}
              sx={{ flex: "0 1 260px", maxWidth: 260 }}
            />
          </Box>
        </Box>

        <CommonTable
          columns={tableColumns}
          data={courses.map((c, idx) => ({
            ...c,
            rowNumber:
              sortCol === 'rowNumber'
                ? (String(sortDir).toLowerCase() === 'asc'
                  ? page * rowsPerPage + idx + 1
                  : Math.max(0, total - (page * rowsPerPage + idx)))
                : Math.max(0, total - (page * rowsPerPage + idx)),
            start_date: c.start_date ? c.start_date.slice(0, 10) : "",
            owner:
              c?.owner?.name ||
              (Array.isArray(c?.owners) && c.owners.length > 0
                ? (universities.find((u) => Number(u.id) === Number(c.owners[0]))?.name || "")
                : ""),
            weeks_to_complete: c?.weeks_to_complete ? `${c?.weeks_to_complete}` : "",
            createdAt: c?.createdAt
              ? new Date(c?.createdAt).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
              : "",
            updatedAt: c?.updatedAt
              ? new Date(c?.updatedAt).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
              : "",
          }))}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={loading}
          onPageChange={setPage}
          onRowsPerPageChange={e => setRowsPerPage(e?.target.value)}
          sortCol={sortCol}
          sortDir={sortDir}
          onSortChange={(col, dir) => {
            setSortCol(col || "id");
            setSortDir(dir);
          }}
          actions={c => (
            <Box display="flex" gap={1} sx={{ justifyContent: "center" }}>
              <IconButton
                onClick={() => navigate(`${navigatePage}/view/${c.id}?pageType=${pageType}`)}
                title="View"
                sx={{
                  color: "primary.main",
                  bgcolor: "primary.50",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "primary.100" },
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => navigate(`${navigatePage}/edit/${c.id}?pageType=${pageType}`)}
                title="Edit"
                sx={{
                  color: "warning.main",
                  bgcolor: "warning.50",
                  borderRadius: 1,
                  "&:hover": { bgcolor: "warning.100" },
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
              {getCurrentUserRole() !== 'moderator' &&
                <IconButton
                  onClick={() => handleOpenDeleteDialog(c.uuid)}
                  title="Delete"
                  sx={{
                    color: "error.main",
                    bgcolor: "error.50",
                    borderRadius: 1,
                    "&:hover": { bgcolor: "error.100" },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              }
            </Box>
          )}
        />

        {/* View Dialog */}
        <Dialog
          open={!!viewingCourse}
          onClose={() => setViewingCourse(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Course Details</DialogTitle>
          <DialogContent>
            {viewingCourse && (
              <Box>
                <Typography><b>ID:</b> {viewingCourse.id}</Typography>
                <Typography><b>Title:</b> {viewingCourse.title}</Typography>
                <Typography><b>Description:</b> {viewingCourse.short_description}</Typography>
                <Typography><b>Start Date:</b> {viewingCourse.start_date?.slice(0, 10)}</Typography>
                <Typography><b>Availability:</b> {viewingCourse.availability}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewingCourse(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog and Snackbar remain unchanged */}
        <Dialog
          open={confirmDelete.open}
          onClose={handleCloseDeleteDialog}
          PaperProps={{
            sx: {
              background: "#fff"
            },
          }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this course?
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default Courses;
