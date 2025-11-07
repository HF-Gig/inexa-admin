import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Rating, Paper, CircularProgress } from '@mui/material';
import { AccessTime, Schedule, School, Event } from '@mui/icons-material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../helpers/api';
import apiCache from '../../helpers/cache';
import CommonAutocomplete from '../../components/CommonAutocomplete';

const capitalizeFirst = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const SortableItem = ({ id, position, course, onEdit, currentTab }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={2.4} ref={setNodeRef} style={style} {...attributes}>
      <Box sx={{ position: 'relative', cursor: 'grab' }}>
        <Card {...listeners} sx={{ bgcolor: 'white', borderRadius: '18px', borderBottomLeftRadius: 0, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }, transition: 'box-shadow 0.3s' }}>
          <CardContent sx={{ p: 3, minHeight: '320px', position: 'relative', pl: 6, pr: '14px', pt: 5, pb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontSize: '14px', fontWeight: 600 }}>Position {position}</Typography>
          {course ? (
            <Box>
              {/* Logos */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 36, mb: 1 }}>
                <img src={`${import.meta.env.VITE_API_URL}${course?.course_provider?.image}`} alt="logo" style={{ height: 18 }} />
                <Box sx={{ width: 1.33, height: 36, borderLeft: '1.33px solid black', borderRadius: 1 }} />
                <img src={course.owner?.certificate_logo_image_url} alt="Certificate" style={{ height: 16 }} />
                <Box sx={{ ml: 'auto' }}>
                  {/* Placeholder for favorite, but since it's admin, omit or use edit icon if needed */}
                </Box>
              </Box>
              {/* Institute */}
              <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 500, letterSpacing: -0.02 * 12, lineHeight: 1.5, color: '#666666', height: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 1, mt: 0.5 }}>
                {course.owner?.name}
              </Typography>
              {/* Type Badge */}
              <Box sx={{ mt: 4, mb: 2, px: 3, py: 0.8, borderRadius: '9999px', fontSize: 10, fontWeight: 500, lineHeight: 1, display: 'inline-block', bgcolor: '#3322ff', color: '#fff' }}>
                {course.content_type === 'program' ? course.program_type_name : capitalizeFirst(course.content_type)}
              </Box>
              {/* Title */}
              <Typography variant="h6" sx={{ height: 66, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', mb: 4, fontSize: 14, color: '#282828', letterSpacing: -0.05 * 14, lineHeight: 1.57, fontWeight: 500 }}>
                {course.title}
              </Typography>
              {/* Details */}
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Schedule sx={{ fontSize: 12, color: course.pacing_type === 'self_paced' ? '#282828' : '#3322ff' }} />
                  <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.02 * 11, color: course.pacing_type === 'self_paced' ? '#282828' : '#3322ff' }}>
                    {course.pacing_type === 'self_paced' ? 'Self Paced' : 'Fully Interactive Learning'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <AccessTime sx={{ fontSize: 12, color: '#282828' }} />
                  <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.02 * 11, color: '#282828' }}>
                    {course.weeks_to_complete ? `${Math.ceil(course.weeks_to_complete / 4)} months` : '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <School sx={{ fontSize: 12, color: '#282828' }} />
                  <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.02 * 11, color: '#282828' }}>
                    {course.content_type !== 'program' ? capitalizeFirst(course.course_level) : `${course.total_courses || 0} Courses`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Event sx={{ fontSize: 12, color: '#282828' }} />
                  <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 500, lineHeight: 1.18, letterSpacing: -0.02 * 11, color: '#282828' }}>
                    {course.start_date ? new Date(course.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', borderRadius: 1 }}>
              <Typography>No course selected</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      <Button size="small" variant="outlined" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(currentTab, position); }} sx={{ position: 'absolute', top: 8, right: 8, fontSize: '12px', px: 2, py: 0.5, borderRadius: 2 }}>
        Edit
      </Button>
      </Box>
    </Grid>
  );
};

const SortableSubjectItem = ({ id, subject, onStatusChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Grid item xs={12} sm={6} md={4} key={subject.id}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box ref={setNodeRef} style={style} {...attributes} sx={{ flexGrow: 1, cursor: 'grab' }}>
          <Card {...listeners} sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'white', borderRadius: '18px', borderBottomLeftRadius: 0, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }, transition: 'box-shadow 0.3s' }}>
            <img src={subject.image_url} alt={subject.title} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{subject.title}</Typography>
            </Box>
          </Card>
        </Box>
        <Checkbox
          checked={subject.status == 1 || subject.status === true}
          onChange={async (e) => {
            const newStatus = e.target.checked ? 1 : 0;
            try {
              await api.put(`/subjects/status/${subject.id}`, { status: newStatus });
              // Update the subjects state
              onStatusChange(subject.id, newStatus);
            } catch (error) {
              //console.error('Error updating subject status', error);
            }
          }}
        />
      </Box>
    </Grid>
  );
};

const SortableExploreItem = ({ id, course, position, category, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const courseTitle = course?.title || `Placeholder ${position}`;
  const courseId = course?.id;

  const handleClick = () => {
    if (courseId) {
      window.open(`/courses/${courseId}`, '_blank');
    }
  };

  return (
    <Grid item xs={12} ref={setNodeRef} style={style} {...attributes}>
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: 2,
          p: 2,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: courseId ? 'pointer' : 'default',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: courseId ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)',
            bgcolor: courseId ? 'grey.100' : 'white',
          },
          position: 'relative',
        }}
        onClick={handleClick}
      >
        <Box {...listeners} sx={{ position: 'absolute', top: 8, left: 8, cursor: 'grab', fontSize: '12px' }}>
          ⋮⋮
        </Box>
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => { e.stopPropagation(); onEdit(category, position); }}
          sx={{ position: 'absolute', top: 8, right: 8, fontSize: '12px', px: 2, py: 0.5, borderRadius: 2 }}
        >
          Edit
        </Button>
        <Typography variant="subtitle1" sx={{ textAlign: 'center', color: courseId ? 'primary.main' : 'text.disabled' }}>
          {courseTitle}
        </Typography>
      </Box>
    </Grid>
  );
};

const SortableFacilitatorItem = ({ id, facilitator, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={3} ref={setNodeRef} style={style} {...attributes}>
      <Box sx={{ position: 'relative', cursor: 'grab' }}>
        <Card {...listeners} sx={{ bgcolor: 'white', borderRadius: '18px', borderBottomLeftRadius: 0, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', '&:hover': { boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }, transition: 'box-shadow 0.3s' }}>
          <CardContent sx={{ p: 3, minHeight: '200px', position: 'relative', pl: 6, pr: '14px', pt: 5, pb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <img
                src={facilitator.facilitator?.profile_image_url || '/default-avatar.png'}
                alt="Avatar"
                style={{ width: 60, height: 60, borderRadius: '50%' }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}>
              {`${facilitator.facilitator?.first_name || ''} ${facilitator.facilitator?.last_name || ''}`.trim()}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 14, color: '#666', mb: 1 }}>
              {facilitator.facilitator?.subject_expertise || '-'}
            </Typography>
          </CardContent>
        </Card>
        <Button size="small" variant="outlined" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(facilitator); }} sx={{ position: 'absolute', top: 8, right: 8, fontSize: '12px', px: 2, py: 0.5, borderRadius: 2 }}>
          Edit
        </Button>
        <Button size="small" variant="outlined" color="error" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(facilitator.id); }} sx={{ position: 'absolute', top: 8, right: 80, fontSize: '12px', px: 2, py: 0.5, borderRadius: 2 }}>
          Delete
        </Button>
      </Box>
    </Grid>
  );
};

const SortableTestimonialRow = ({ testimonial, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: testimonial.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell {...listeners} sx={{ cursor: 'grab' }}>
        ⋮⋮
      </TableCell>
      <TableCell>{testimonial.name}</TableCell>
      <TableCell>
        <Rating value={testimonial.rating} readOnly />
      </TableCell>
      <TableCell>{testimonial.content}</TableCell>
      <TableCell>
        <Button size="small" onClick={() => onEdit(testimonial)}>
          Edit
        </Button>
        <Button size="small" color="error" onClick={() => onDelete(testimonial.id)}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
};


const Featured = () => {
  const [featured, setFeatured] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState({});
  const [currentTab, setCurrentTab] = useState('courses_certificates');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadedCategories, setLoadedCategories] = useState({});
  const [facilitators, setFacilitators] = useState([]);
  const [editingFacilitator, setEditingFacilitator] = useState(null);
  const [deleteFacilitatorConfirm, setDeleteFacilitatorConfirm] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [selectedFacilitator, setSelectedFacilitator] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const featuredCourses = featured.null?.[currentTab] || [];
    const items = Array.isArray(featuredCourses) ? featuredCourses.map((course, index) => course?.id || `empty-${index + 1}`) : [];
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newFeatured = {
      ...featured,
      null: {
        ...featured.null,
        [currentTab]: arrayMove(
          [...(featured.null?.[currentTab] || [])],
          oldIndex,
          newIndex
        ),
      },
    };

    setFeatured(newFeatured);

    // Save to backend
    try {
      const promises = [];

      for (let pos = 1; pos <= 15; pos++) {
        const oldCourse = featured?.null?.[currentTab]?.[pos - 1];
        const newCourse = newFeatured?.null?.[currentTab]?.[pos - 1];

        if (oldCourse?.id !== newCourse?.id) {
          promises.push(
            api.put(`/courses/featured/${pos}`, {
              course_id: newCourse?.id || null,
              category: currentTab,
              place: 'null',
            })
          );
        }
      }

      await Promise.all(promises);
      fetchData();
    } catch (error) {
      console.error('❌ Error saving reorder:', error);
      setFeatured(featured);
    }
  };

  const handleDragEndFacilitators = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = facilitators.findIndex(f => f.id === active.id);
    const newIndex = facilitators.findIndex(f => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newFacilitators = arrayMove(facilitators, oldIndex, newIndex);
    setFacilitators(newFacilitators);

    // Update positions
    try {
      const promises = newFacilitators.map((facilitator, index) => {
        const newPosition = index + 1;
        return api.put(`/staff/featured/${newPosition}`, {
          facilitator_id: facilitator.facilitator_id
        });
      });

      await Promise.all(promises);
      console.log('✅ Facilitator positions updated!');
      // Refetch to ensure consistency
      const res = await api.get('/staff/get-featured-facilitators');
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setFacilitators(res.data.data);
      }
    } catch (error) {
      console.error('❌ Error saving facilitator reorder:', error);
      // Revert on error
      const res = await api.get('/staff/get-featured-facilitators');
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setFacilitators(res.data.data);
      }
    }
  };

  const handleDragEndSubjects = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = subjects.findIndex(subject => subject.id === active.id);
    const newIndex = subjects.findIndex(subject => subject.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newSubjects = arrayMove(subjects, oldIndex, newIndex);
    setSubjects(newSubjects);

    // Update display_order for all subjects
    const updatedSubjects = newSubjects.map((subject, index) => ({
      id: subject.id,
      display_order: index + 1
    }));

    try {
      await api.put('/subjects/order', { subjects: updatedSubjects });
      const fetchSubjects = async () => {
        try {
          const res = await api.get('/subjects');
          if (res.data && Array.isArray(res.data)) {
            const sorted = [...res.data].sort((a, b) => {
              if (a.status === b.status) {
                return (a.display_order || 0) - (b.display_order || 0);
              }
              return b.status - a.status; // active (1) first, inactive (0) after
            });
            setSubjects(sorted);
          } else {
            setSubjects([]);
          }
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setSubjects([]);
        }
      };
      fetchSubjects();
    } catch (error) {
      console.error('Error saving subjects reorder:', error);
      // Optionally revert on error
      setSubjects(subjects);
    }
  };

  const handleSubjectStatusChange = (subjectId, newStatus) => {
    setSubjects(subjects.map(s => s.id === subjectId ? { ...s, status: newStatus } : s));
  };

  const handleDragEndTestimonials = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = testimonials.findIndex(t => t.id === active.id);
    const newIndex = testimonials.findIndex(t => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newTestimonials = arrayMove(testimonials, oldIndex, newIndex);
    setTestimonials(newTestimonials);

    // Update position in backend
    const updatedTestimonials = newTestimonials.map((testimonial, index) => ({
      id: testimonial.id,
      position: index + 1
    }));

    try {
      await api.put('/testimonial/order', { testimonials: updatedTestimonials });
    } catch (error) {
      console.error('Error saving testimonials reorder:', error);
      // Revert on error
      setTestimonials(testimonials);
    }
  };

  useEffect(() => {
    fetchData();
    loadAllCourses();
  }, []);

  useEffect(() => {
    if (currentTab === 'subjects') {
      const fetchSubjects = async () => {
        try {
          const res = await api.get('/subjects');
          console.log("Fetched subjects:", res.data);
          if (res.data && Array.isArray(res.data)) {
            const sorted = [...res.data].sort((a, b) => {
              if (a.status === b.status) {
                return (a.display_order || 0) - (b.display_order || 0);
              }
              return b.status - a.status; // active (1) first, inactive (0) after
            });

            setSubjects(sorted);
          } else {
            setSubjects([]);
          }
        } catch (error) {
          setSubjects([]);
        }
      };
      fetchSubjects();
    }
  }, [currentTab]);

  useEffect(() => {
    const newCourses = allCourses[currentTab] || [];
    console.log("Setting courses for tab", currentTab, ":", newCourses);
    setCourses(newCourses);
    if (newCourses.length === 0 && !loadedCategories[currentTab]) {
      loadCoursesForCategory(currentTab);
    }
  }, [currentTab, allCourses, loadedCategories]);

  const fetchOptionsForEdit = async (search) => {
    let mappedCategory = editingPosition.category;
    if (editingPosition.category === 'degree') {
      mappedCategory = 'degree';
    } else if (editingPosition.category === 'courses_certificates' || editingPosition.category === 'popular') {
      mappedCategory = 'courses_certificates';
    } else if (editingPosition.category === 'professional-certificate') {
      mappedCategory = 'professional-certificate';
    }
    return await fetchCourses(search, mappedCategory, 50);
  };

  useEffect(() => {
    if (currentTab === 'testimonials') {
      const fetchTestimonials = async () => {
        try {
          const res = await api.get('/testimonial');
          if (res.data && Array.isArray(res.data)) {
            setTestimonials(res.data);
          } else {
            setTestimonials([]);
          }
        } catch (error) {
          console.error('Error fetching testimonials:', error);
          setTestimonials([]);
        }
      };
      fetchTestimonials();
    } else if (currentTab === 'featured_facilitators') {
      const fetchFacilitators = async () => {
        try {
          const res = await api.get('/staff/get-featured-facilitators');
          console.log("Featured Facilitators fetched: ", res.data.data);
          if (res.data && res.data.data && Array.isArray(res.data.data)) {
            setFacilitators(res.data.data);
          } else {
            setFacilitators([]);
          }
        } catch (error) {
          console.error('Error fetching featured facilitators:', error);
          setFacilitators([]);
        }
      };
      const fetchAllStaff = async () => {
        try {
          const res = await api.get('/staff/inexa-staff/get-all');
          console.log("Fetched inexa staff for dropdown: ", res.data.data)
          if (res.data && res.data.data && Array.isArray(res.data.data)) {
            setAllStaff(res.data.data);
          } else {
            setAllStaff([]);
          }
        } catch (error) {
          console.error('Error fetching all staff:', error);
          setAllStaff([]);
        }
      };
      fetchFacilitators();
      fetchAllStaff();
    }
  }, [currentTab]);

  const fetchData = async () => {
    try {
      const featuredRes = await api.get('/courses/featured-courses');
      const featuredData = featuredRes.data || {};
      featuredData.null = featuredData.null || {};
      featuredData.explore_menu = featuredData.explore_menu || {
        popular: Array(8).fill(null),
        courses_certificates: Array(6).fill(null),
        'professional-certificate': Array(6).fill(null),
        micro_masters_bachelors: Array(6).fill(null)
      };
      const categories = ['courses_certificates', 'micro_masters_bachelors', 'degree'];
      for (const cat of categories) {
        if (featuredData.null[cat]) {
          console.log(`Fetching full courses for category: ${cat}, initial length: ${featuredData.null[cat].length}`);
          const fullCourses = await Promise.all(
            featuredData.null[cat].map(async (course) => {
              if (course && course.id) {
                try {
                  const courseRes = await api.get(`/courses/${course.id}`);
                  return courseRes.data.data;
                } catch (error) {
                  console.error(`Error fetching course ${course.id}:`, error);
                  return course; // fallback to basic data
                }
              } else {
                return null; // keep null for empty positions
              }
            })
          );
          console.log(`Fetched full courses for ${cat}, length: ${fullCourses.length}`);
          // Pad the array to 15 with nulls for placeholders
          featuredData.null[cat] = fullCourses.concat(Array(15 - fullCourses.length).fill(null));
          console.log(`Padded array for ${cat}, final length: ${featuredData.null[cat].length}`);
        } else {
          console.log(`No data for category: ${cat}`);
        }
      }
      // Fetch full courses for explore_menu
      const exploreCategories = ['popular', 'courses_certificates', 'professional-certificate', 'micro_masters_bachelors'];
      for (const cat of exploreCategories) {
        if (featuredData.explore_menu[cat]) {
          console.log(`Fetching full courses for explore_menu category: ${cat}`);
          const fullCourses = await Promise.all(
            featuredData.explore_menu[cat].map(async (course) => {
              if (course && course.id) {
                try {
                  const courseRes = await api.get(`/courses/${course.id}`);
                  return courseRes.data.data;
                } catch (error) {
                  console.error(`Error fetching course ${course.id}:`, error);
                  return course; // fallback to basic data
                }
              } else {
                return null; // keep null for empty positions
              }
            })
          );
          featuredData.explore_menu[cat] = fullCourses;
        }
      }
      console.log("Setting featured data:", featuredData);
      setFeatured(featuredData);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  let debounceTimer;

  const fetchCourses = async (search, category = 'courses_certificates', pageSize = 3500) => {
    return new Promise((resolve) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        let query = search ? `search=${encodeURIComponent(search)}&` : '';
        const slugMap = {
          'courses_certificates': 'course,professional-certificate',
          'micro_masters_bachelors': 'micromasters,microbachelors',
          'degree': 'degree',
          'popular': 'course,professional-certificate,micromasters,microbachelors,degree',
          'professional-certificate': 'professional-certificate'
        };
        const slug = slugMap[category];
        if (slug) query += `program_type_slug=${slug}&`;

        if (category === 'courses_certificates' || category === 'popular') {
          query += `content_type!=program&`;
        } else if (category === 'micro_masters_bachelors' || category === 'degree' || category === 'professional-certificate') {
          query += `content_type=program&`;
        }

        const cacheKey = `/courses?${query}page_size=${pageSize}`;
        try {
          const res = await api.get(cacheKey);
          const data = res.data?.data?.map(c => ({
            label: `${c.title} (${c.content_type === 'program' ? c.program_type_name : capitalizeFirst(c.course_level)})`,
            value: c.id
          })) || [];
          data.sort((a, b) => a.label.localeCompare(b.label));
          if (pageSize === 3500) apiCache.set(cacheKey, data);
          resolve(data);
        } catch (error) {
          resolve([]);
        }
      }, 400); // delay in ms
    });
  };

  const handleEdit = (category, position) => {
    setEditingPosition({ category, position });
    let currentCourse = null;
    if (currentTab === 'explore_menu') {
      currentCourse = featured.explore_menu?.[category]?.[position - 1] || null;
    } else {
      currentCourse = featured.null?.[currentTab]?.[position - 1] || null;
    }
    setSelectedCourse(currentCourse ? { value: currentCourse.id, label: `${currentCourse.title} (${currentCourse.content_type === 'program' ? currentCourse.program_type_name : capitalizeFirst(currentCourse.course_level)})` } : null);
  };

  const handleSave = async () => {
    if (editingPosition && selectedCourse) {
      try {
        const position = editingPosition.position;
        const category = editingPosition.category;
        const place = currentTab === 'explore_menu' ? 'explore_menu' : 'null';
        const payload = { course_id: selectedCourse, category, place };
        // console.log('Payload being sent to backend:', payload);
        const resp = await api.put(`/courses/featured/${position}`, payload);
        // console.log("Response from save featured card: ", resp);
        console.log("Response data:", resp.data);
        // window.location.reload();
        fetchData();
        setEditingPosition(null);
        setSelectedCourse(null);
      } catch (error) {
        console.error('Error updating featured course', error);
      }
    }
  };

  const handleClose = () => {
    setEditingPosition(null);
    setSelectedCourse(null);
  };

  const handleSaveTestimonial = async () => {
    if (editingTestimonial) {
      try {
        const payload = {
          name: editingTestimonial.name,
          rating: editingTestimonial.rating,
          content: editingTestimonial.content
        };
        if (editingTestimonial.id) {
          await api.put(`/testimonial/${editingTestimonial.id}`, payload);
        } else {
          await api.post('/testimonial', payload);
        }
        setEditingTestimonial(null);
        // Refetch testimonials
        const res = await api.get('/testimonial');
        if (res.data && Array.isArray(res.data)) {
          setTestimonials(res.data);
        } else {
          setTestimonials([]);
        }
      } catch (error) {
        console.error('Error saving testimonial:', error);
      }
    }
  };

  const handleDeleteTestimonial = async () => {
    if (deleteConfirm) {
      try {
        await api.delete(`/testimonial/${deleteConfirm}`);
        setDeleteConfirm(null);
        // Refetch testimonials
        const res = await api.get('/testimonial');
        if (res.data && Array.isArray(res.data)) {
          setTestimonials(res.data);
        } else {
          setTestimonials([]);
        }
      } catch (error) {
        console.error('Error deleting testimonial:', error);
      }
    }
  };

  const handleCloseTestimonial = () => {
    setEditingTestimonial(null);
  };

  const handleSaveFacilitator = async () => {
    if (editingFacilitator && selectedFacilitator) {
      try {
        console.log(`Editing Facilitator: ${JSON.stringify(editingFacilitator)}, Selected Facilitator: ${selectedFacilitator}`)
        if (editingFacilitator.id) {
          // Update existing
          await api.put(`/staff/update-featured-facilitator/${editingFacilitator.id}`, {
            facilitator_id: selectedFacilitator
          });
        } else {
          // Add new
          console.log("Sending request to /staff/add-featured-facilitator")
          const res = await api.post('/staff/add-featured-facilitator', {
            facilitator_id: selectedFacilitator
          });
          console.log("Received response: ", res.data)
          
        }
        setEditingFacilitator(null);
        setSelectedFacilitator(null);
        // Refetch facilitators
        const res = await api.get('/staff/get-featured-facilitators');
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          setFacilitators(res.data.data);
        } else {
          setFacilitators([]);
        }
      } catch (error) {
        console.error('Error saving facilitator:', error);
      }
    }
  };

  const handleDeleteFacilitator = async () => {
    if (deleteFacilitatorConfirm) {
      try {
        await api.delete(`/staff/remove-featured-facilitator/${deleteFacilitatorConfirm}`);
        setDeleteFacilitatorConfirm(null);
        // Refetch facilitators
        const res = await api.get('/staff/get-featured-facilitators');
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          setFacilitators(res.data.data);
        } else {
          setFacilitators([]);
        }
      } catch (error) {
        console.error('Error deleting facilitator:', error);
      }
    }
  };

  const handleCloseFacilitator = () => {
    setEditingFacilitator(null);
    setSelectedFacilitator(null);
  };

  const fetchFacilitatorOptions = async (search) => {
    let options = allStaff.map(staff => ({
      label: `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
      value: staff.id
    }));
    if (search) {
      options = options.filter(option => option.label.toLowerCase().includes(search.toLowerCase()));
    }
    return options;
  };

  const loadAllCourses = async () => {
    const categories = ['courses_certificates', 'micro_masters_bachelors', 'degree'];
    const allData = {};

    // First, load from cache if available
    for (const cat of categories) {
      const cacheKey = getCacheKey(cat);
      const cachedData = apiCache.get(cacheKey);
      //console.log("Cache get for", cat, "key:", cacheKey, "data:", cachedData);
      if (cachedData && cachedData.length > 0) {
        allData[cat] = cachedData;
        setLoadedCategories(prev => ({ ...prev, [cat]: true }));
      } else {
        allData[cat] = [];
      }
    }
    setAllCourses(allData);
    //console.log("Loaded courses from cache:", allData);
  };

  const loadCoursesForCategory = async (category) => {
    if (loadedCategories[category]) return; // Already loaded

    setLoadingCourses(true);
    try {
      const data = await fetchCourses('', category);
      setAllCourses(prev => ({ ...prev, [category]: data }));
      const cacheKey = getCacheKey(category);
      apiCache.set(cacheKey, data);
      setLoadedCategories(prev => ({ ...prev, [category]: true }));
      console.log(`Loaded fresh courses for ${category}:`, data.length);
    } catch (error) {
      console.error(`Error loading courses for ${category}:`, error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const getCacheKey = (category) => {
    let query = 'page_size=3500&';
    const slugMap = {
      'courses_certificates': 'course,professional-certificate',
      'micro_masters_bachelors': 'micromasters,microbachelors',
      'degree': 'degree'
    };
    const slug = slugMap[category];
    if (slug) query += `program_type_slug=${slug}&`;
    // Add content_type filter
    if (category === 'courses_certificates') {
      query += `content_type!=program&`;
    } else if (category === 'micro_masters_bachelors' || category === 'degree') {
      query += `content_type=program&`;
    }
    return `/courses?${query}`;
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const featuredCourses = featured.null?.[currentTab] || [];
  const items = Array.isArray(featuredCourses) ? featuredCourses.map((course, index) => course?.id || `empty-${index + 1}`) : [];

  // New component for Explore Menu placeholders
  const ExploreMenu = ({ onEdit }) => {
    // Placeholder data for each column
    const popularPlaceholders = Array(8).fill(null);
    const coursePlaceholders = Array(6).fill(null);
    const professionalCertificatePlaceholders = Array(6).fill(null);
    const degreePlaceholders = Array(6).fill(null);

    const handleDragEndExplore = async (category, event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const items = Array.from({ length: featured.explore_menu[category].length }, (_, i) => `slot-${category}-${i}`);
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newFeatured = { ...featured };
      newFeatured.explore_menu[category] = arrayMove(newFeatured.explore_menu[category], oldIndex, newIndex);
      setFeatured(newFeatured);

      // Save every slot explicitly
      try {
        const promises = newFeatured.explore_menu[category].map((course, idx) => {
          console.log(`PUT /courses/featured/${idx + 1}`, {
            course_id: course?.id || null,
            category,
            place: 'explore_menu'
          });
          return api.put(`/courses/featured/${idx + 1}`, {
            course_id: course?.id || null,
            category,
            place: 'explore_menu'
          });
        });

        await Promise.all(promises);
        console.log("Backend update successful");
        fetchData();
      } catch (error) {
        console.error("Error saving reorder", error);
        setFeatured(featured); // revert
      }
    };


    // Helper to render sortable explore item
    const renderSortableItem = (index, category, position) => {
      const course = featured.explore_menu?.[category]?.[position] || null;
      return (
        <SortableExploreItem
          key={`${category}-${index}`}
          id={`slot-${category}-${position}`}
          course={course}
          position={position + 1}
          category={category}
          onEdit={onEdit}
        />
      );
    };

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>Popular</Typography>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEndExplore('popular', event)}>
              <SortableContext items={Array.from({ length: featured.explore_menu?.popular?.length || 8 }, (_, i) => `slot-popular-${i}`)}>
                <Grid container spacing={2}>
                  {popularPlaceholders.map((_, idx) => renderSortableItem(idx, 'popular', idx))}
                </Grid>
              </SortableContext>
            </DndContext>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>Course</Typography>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEndExplore('courses_certificates', event)}>
              <SortableContext items={Array.from({ length: featured.explore_menu?.courses_certificates?.length || 6 }, (_, i) => `slot-courses_certificates-${i}`)}>
                <Grid container spacing={2}>
                  {coursePlaceholders.map((_, idx) => renderSortableItem(idx, 'courses_certificates', idx))}
                </Grid>
              </SortableContext>
            </DndContext>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>Professional Certificate</Typography>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEndExplore('professional-certificate', event)}>
              <SortableContext items={Array.from({ length: featured.explore_menu?.['professional-certificate']?.length || 6 }, (_, i) => `slot-professional-certificate-${i}`)}>
                <Grid container spacing={2}>
                  {professionalCertificatePlaceholders.map((_, idx) => renderSortableItem(idx, 'professional-certificate', idx))}
                </Grid>
              </SortableContext>
            </DndContext>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ mb: 2 }}>Degree</Typography>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEndExplore('micro_masters_bachelors', event)}>
              <SortableContext items={Array.from({ length: featured.explore_menu?.micro_masters_bachelors?.length || 3 }, (_, i) => `slot-micro_masters_bachelors-${i}`)}>
                <Grid container spacing={2}>
                  {degreePlaceholders.map((_, idx) => renderSortableItem(idx, 'micro_masters_bachelors', idx))}
                </Grid>
              </SortableContext>
            </DndContext>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Featured Courses
      </Typography>
      <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        <Tab sx={{ '&:hover': { color: 'white' } }} label="Courses & Certificates" value="courses_certificates" />
        <Tab sx={{ '&:hover': { color: 'white' } }} label="MicroMasters & MicroBachelors" value="micro_masters_bachelors" />
        <Tab sx={{ '&:hover': { color: 'white' } }} label="Degree Programs" value="degree" />
        <Tab sx={{ '&:hover': { color: 'white' } }} label="Explore Menu" value="explore_menu" />
        <Tab sx={{ '&:hover': { color: 'white' } }} label="Popular Subjects" value="subjects" />
        <Tab sx={{ '&:hover': { color: 'white' } }} label="Testimonials" value="testimonials" />
        <Tab sx={{ '&:hover': { color: 'white' } }} label="Featured Facilitators" value="featured_facilitators" />
      </Tabs>
      {currentTab === 'subjects' ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSubjects}>
          <SortableContext items={subjects.map(subject => subject.id)}>
            <Grid container spacing={3}>
              {subjects.map((subject) => (
                <SortableSubjectItem key={subject.id} id={subject.id} subject={subject} onStatusChange={handleSubjectStatusChange} />
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      ) : currentTab === 'testimonials' ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Testimonials</Typography>
            <Button variant="contained" onClick={() => setEditingTestimonial({})}>
              Add Testimonial
            </Button>
          </Box>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndTestimonials}>
            <SortableContext items={testimonials.map(testimonial => testimonial.id)}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Content</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testimonials.map((testimonial) => (
                      <SortableTestimonialRow key={testimonial.id} testimonial={testimonial} onEdit={setEditingTestimonial} onDelete={setDeleteConfirm} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SortableContext>
          </DndContext>
        </Box>
      ) : currentTab === 'featured_facilitators' ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Featured Facilitators</Typography>
            <Button variant="contained" onClick={() => setEditingFacilitator({})}>
              Add Facilitator
            </Button>
          </Box>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFacilitators}>
            <SortableContext items={facilitators.map(facilitator => facilitator.id)}>
              <Grid container spacing={3}>
                {facilitators.map((facilitator) => (
                  <SortableFacilitatorItem key={facilitator.id} id={facilitator.id} facilitator={facilitator} onEdit={setEditingFacilitator} onDelete={setDeleteFacilitatorConfirm} />
                ))}
              </Grid>
            </SortableContext>
          </DndContext>
        </Box>
      ) : currentTab === 'explore_menu' ? (
        <ExploreMenu onEdit={handleEdit} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items}>
            <Grid container spacing={3}>
              {Array.from({ length: 15 }, (_, i) => i + 1).map(position => {
                const course = featuredCourses[position - 1];
                const itemId = course?.id || `empty-${position}`;
              return <SortableItem key={itemId} id={itemId} position={position} course={course} onEdit={handleEdit} currentTab={currentTab} />;
              })}
            </Grid>
          </SortableContext>
        </DndContext>
      )}
      <Dialog open={editingPosition !== null} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "white" }}>Select Course for Position {editingPosition?.position}</DialogTitle>
        <DialogContent>
            <CommonAutocomplete
              label="Course"
              fetchOptions={fetchOptionsForEdit}
              value={selectedCourse}
              onChange={(value) => {
                console.log("🧠 Selected course:", value);
                setSelectedCourse(value);
              }}
              placeholder="Select a course"
              isSelect={true}
              externalFilter={true}
              fetchOnMount={false}
              sx={{
                '& .MuiInputLabel-root': {
                  color: 'white',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                  '&.MuiFormLabel-filled': {
                    color: 'white',
                  },
                },
              }}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {console.log("Using course: ", selectedCourse)}
          <Button type='submit' onClick={handleSave} variant="contained" disabled={!selectedCourse}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingTestimonial !== null} onClose={handleCloseTestimonial} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "white" }}>{editingTestimonial?.id ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={editingTestimonial?.name}
            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
          />
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={editingTestimonial?.rating || 0}
              onChange={(event, newValue) => setEditingTestimonial({ ...editingTestimonial, rating: newValue })}
            />
          </Box>
          <TextField
            label="Content"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={editingTestimonial?.content}
            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button sx={{ color: "white" }} onClick={handleCloseTestimonial}>Cancel</Button>
          <Button onClick={handleSaveTestimonial} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "white" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this testimonial?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteTestimonial} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingFacilitator !== null} onClose={handleCloseFacilitator} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "white" }}>{editingFacilitator?.id ? 'Edit Facilitator' : 'Add Facilitator'}</DialogTitle>
        <DialogContent>
          <CommonAutocomplete
            label="Facilitator"
            fetchOptions={fetchFacilitatorOptions}
            value={selectedFacilitator}
            onChange={(value) => {
              setSelectedFacilitator(value);
            }}
            placeholder="Select a facilitator"
            isSelect={true}
            externalFilter={true}
            fetchOnMount={false}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'white',
                '&.Mui-focused': {
                  color: 'white',
                },
                '&.MuiFormLabel-filled': {
                  color: 'white',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button sx={{ color: "white" }} onClick={handleCloseFacilitator}>Cancel</Button>
          <Button onClick={handleSaveFacilitator} variant="contained" disabled={!selectedFacilitator}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteFacilitatorConfirm !== null} onClose={() => setDeleteFacilitatorConfirm(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "white" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this facilitator?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFacilitatorConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteFacilitator} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Featured;
