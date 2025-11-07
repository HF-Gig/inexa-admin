import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, Typography, Button, CircularProgress, Paper, IconButton, Snackbar, Alert, Grid, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions as MuiDialogActions, Checkbox, Fade, Avatar, Divider,
    Tooltip
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CommonAutocomplete from "../../components/CommonAutocomplete";
import api from "../../helpers/api";

const ManageCourses = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addCourseValue, setAddCourseValue] = useState(null);
    const [addCourseInput, setAddCourseInput] = useState("");
    const [addCourseLoading, setAddCourseLoading] = useState(false);
    const [removeCourseLoading, setRemoveCourseLoading] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [unassignLoading, setUnassignLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/staff/${id}`),
            api.get(`/staff/${id}/assigned-courses`),
            api.get(`/courses/all-filters?filter=courses`)
        ]).then(([staffRes, assignedRes, allRes]) => {
            setStaff(staffRes.data.data);
            setAssignedCourses(assignedRes.data.data || []);
            setAllCourses(allRes.data.courses || []);
        }).catch(() => {
            setSnackbar({ open: true, message: "Failed to fetch data.", severity: "error" });
        }).finally(() => setLoading(false));
    }, [id]);

    const handleAddCourse = async () => {
        if (!addCourseValue) return;
        setAddCourseLoading(true);
        try {
            await api.post(`/staff/${id}/assign-courses`, { courseIds: addCourseValue });
            const res = await api.get(`/staff/${id}/assigned-courses`);
            setAssignedCourses(res.data.data || []);
            setAddCourseValue(null);
            setAddCourseInput("");
            setAddDialogOpen(false);
            setSnackbar({ open: true, message: "Course assigned successfully!", severity: "success" });
        } catch {
            setSnackbar({ open: true, message: "Failed to assign course.", severity: "error" });
        } finally {
            setAddCourseLoading(false);
        }
    };

    const handleRemoveCourse = async (courseId) => {
        setRemoveCourseLoading(l => ({ ...l, [courseId]: true }));
        try {
            await api.delete(`/staff/${id}/unassign-courses/${courseId}`);
            setAssignedCourses(courses => courses.filter(c => c.id !== courseId));
            setSnackbar({ open: true, message: "Course unassigned successfully!", severity: "success" });
        } catch {
            setSnackbar({ open: true, message: "Failed to unassign course.", severity: "error" });
        } finally {
            setRemoveCourseLoading(l => ({ ...l, [courseId]: false }));
        }
    };

    // Handler for selecting/deselecting a course
    const handleSelectCourse = (courseId) => {
        setSelectedCourseIds((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId]
        );
    };
    // Handler for unassigning selected courses
    const handleUnassignSelected = async () => {
        if (selectedCourseIds.length === 0) return;
        setUnassignLoading(true);
        try {
            await api.post(`/staff/${id}/unassign-courses`, { courseIds: selectedCourseIds });
            const res = await api.get(`/staff/${id}/assigned-courses`);
            setAssignedCourses(res.data.data || []);
            setSelectedCourseIds([]);
            setSnackbar({ open: true, message: "Courses unassigned successfully!", severity: "success" });
        } catch {
            setSnackbar({ open: true, message: "Failed to unassign courses.", severity: "error" });
        } finally {
            setUnassignLoading(false);
        }
    };

    const unassignedCourses = allCourses.filter(c => !assignedCourses.some(ac => ac.id === c.id));

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: 1100, mx: "auto",  position: 'relative' }}>
            <Paper sx={{ border:0, boxShadow: 'none', background: '#fff' }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#fff',
                        borderRadius: 2,
                        p: 0,
                        // border: '1px solid #e0e0e0',
                        mb: 2,
                        boxShadow: 0,
                        minHeight: 80,
                    }}
                >
                    <Tooltip title="Back">
                        <IconButton
                            onClick={() => navigate(-1)}
                            sx={{
                                color: 'primary.main',
                                mr: 2,
                                p: 1.2,
                                border: '1px solid #e0e0e0',
                                bgcolor: '#fafbfc',
                                '&:hover': { bgcolor: 'primary.50' },
                            }}
                            size="large"
                        >
                            <ArrowBackIcon fontSize="medium" />
                        </IconButton>
                    </Tooltip>
                    {staff && (
                        <Avatar
                            src={staff.profile_image_url || undefined}
                            alt={staff.given_name || ''}
                            sx={{
                                width: 56,
                                height: 56,
                                // bgcolor: 'primary.main',
                                fontWeight: 700,
                                fontSize: 24,
                                mr: 2,
                            }}
                        >
                            {(!staff.profile_image_url && staff.given_name) ? staff.given_name[0] : ''}
                        </Avatar>
                    )}
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="text.primary">
                            {staff?.given_name} {staff?.family_name}
                        </Typography>
                        {staff?.position_title && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
                                {staff.position_title}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle1">Assigned Courses:</Typography>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={selectedCourseIds.length === 0 || unassignLoading}
                        onClick={handleUnassignSelected}
                        startIcon={<DeleteIcon />}
                        sx={{ minWidth: 160, fontWeight: 600, boxShadow: 2 }}
                    >
                        {unassignLoading ? <CircularProgress size={20} /> : "Delete Selected"}
                    </Button>
                </Box>
                <Grid container spacing={3}>
                    {/* Add Course Card */}
                    <Grid item xs={12} sm={6} md={4} lg={3} key="add-course">
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '2px dashed #1976d2',
                                cursor: 'pointer',
                                minHeight: 170,
                                background: '#f5f8ff',
                                borderRadius: 3,
                                boxShadow: 0,
                                transition: 'box-shadow 0.2s, border-color 0.2s',
                                '&:hover': { borderColor: '#004aad', boxShadow: 3, background: '#e3edfa' },
                            }}
                            onClick={() => setAddDialogOpen(true)}
                        >
                            <CardContent sx={{ textAlign: 'center' }}>
                                <AddIcon sx={{ fontSize: 56, color: '#1976d2', mb: 1 }} />
                                <Typography variant="body1" color="primary" fontWeight={700} fontSize={18}>Add Course</Typography>
                                <Typography variant="caption" color="text.secondary">Assign a new course</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* Assigned Course Cards */}
                    {assignedCourses.length === 0 ? (
                        <Grid item xs={12}>
                            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6}>
                                <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="No courses" width={80} style={{ opacity: 0.5, marginBottom: 12 }} />
                                <Typography variant="body1" color="text.secondary">No courses assigned yet. Click "Add Course" to assign one!</Typography>
                            </Box>
                        </Grid>
                    ) : (
                        assignedCourses.map(course => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        position: 'relative',
                                        borderRadius: 3,
                                        boxShadow: selectedCourseIds.includes(course.id) ? 6 : 2,
                                        border: selectedCourseIds.includes(course.id) ? '2.5px solid #1976d2' : '2.5px solid #e0e0e0',
                                        transition: 'box-shadow 0.2s, border-color 0.2s',
                                        background: selectedCourseIds.includes(course.id) ? '#e3edfa' : '#fff',
                                        '&:hover': { boxShadow: 6, borderColor: '#1976d2', background: '#f5f8ff' },
                                    }}
                                >
                                    {/* Checkbox overlay */}
                                    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                                        <Checkbox
                                            checked={selectedCourseIds.includes(course.id)}
                                            onChange={() => handleSelectCourse(course.id)}
                                            color="primary"
                                            inputProps={{ 'aria-label': 'select course' }}
                                            sx={{ bgcolor: '#fff', borderRadius: '50%' }}
                                        />
                                    </Box>
                                    {/* Course image */}
                                    {course.image_url && (
                                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                style={{
                                                    maxWidth: '90%',
                                                    maxHeight: 90,
                                                    borderRadius: 10,
                                                    objectFit: 'cover',
                                                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
                                                }}
                                            />
                                        </Box>
                                    )}
                                    <CardContent sx={{ pt: 2, pb: 2 }}>
                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            gutterBottom
                                            sx={{
                                                fontSize: 18,
                                                minHeight: 48,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'normal',
                                                height: '66px', // 3 lines * 24px line-height (adjust as needed)
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {course.title}
                                        </Typography>
                                        {course.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{course.description}</Typography>}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
                {/* Loading overlay for unassigning or loading */}
                {(unassignLoading || loading) && (
                    <Fade in={unassignLoading || loading}>
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'rgba(255,255,255,0.7)',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                        }}>
                            <CircularProgress size={48} />
                        </Box>
                    </Fade>
                )}
            </Paper>
            {/* Add Course Dialog */}
            <Dialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        p: 2,
                        background: '#f8fafc',
                        boxShadow: 6,
                    }
                }}
                TransitionComponent={Fade}
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 20, pb: 1 }}>Assign a Course</DialogTitle>
                <Divider sx={{ mb: 2 }} />
                <DialogContent>
                    <CommonAutocomplete
                        name="add-course"
                        label="Select Course"
                        value={addCourseValue}
                        onChange={val => setAddCourseValue(val)}
                        options={unassignedCourses.map(c => ({ value: c.id, label: c.title, image_url: c.image_url }))}
                        allOptions={unassignedCourses.map(c => ({ value: c.id, label: c.title, image_url: c.image_url }))}
                        inputValue={addCourseInput}
                        onInputChange={(e, val, reason) => {
                            if (reason === 'input') { setAddCourseInput(val) }
                        }}
                        multiple={true}
                        onClearInput={() => setAddCourseInput('')}
                        disabled={addCourseLoading}
                        variant="filled"
                        renderOption={(props, option) => (
                            <li {...props} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{option.label}</Typography>
                            </li>
                        )}
                        sx={{ minWidth: 240, mb: 1 }}
                    />
                </DialogContent>
                <MuiDialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                    <Button onClick={() => setAddDialogOpen(false)} color="secondary" sx={{ fontWeight: 600, mr: 2 }}>Cancel</Button>
                    <Button
                        onClick={handleAddCourse}
                        variant="contained"
                        color="primary"
                        disabled={!addCourseValue || addCourseLoading}
                        sx={{ fontWeight: 700, minWidth: 100 }}
                    >
                        {addCourseLoading ? <CircularProgress size={20} /> : "ASSIGN"}
                    </Button>
                </MuiDialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default ManageCourses; 