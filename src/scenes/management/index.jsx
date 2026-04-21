import { useState, useEffect } from "react";
import { Box, IconButton, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Alert, Snackbar } from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { Header } from "../../components";
import CommonTable from "../../components/CommonTable";
import api from "../../helpers/api";

const Management = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [page, setPage] = useState(0);
  const [isOwnRole, setIsOwnRole] = useState(false);
  const [canEditRole, setCanEditRole] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', phone: '', role: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ email: '', first_name: '', last_name: '', phone: '', role: '', password: '' });

  const deleteUser = async (id) => {
    try {
      await api.delete(`${BASE_URL}/users/${id}`);
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  useEffect(() => {
    const fetchAllUsers = async () => {
      const res = await api.get(`${BASE_URL}/users?page=${page + 1}&page_size=${rowsPerPage}`);
      setUsers(res.data.data);
      setTotal(res.data.pagination?.totalItems || 0);
      //console.log("Fetched users:", res.data.data);
    }

    fetchAllUsers();
  }, [page, rowsPerPage]);

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

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner':
        return '#ff5722';
      case 'admin':
        return '#3322ff';
      case 'manager':
        return '#45db00';
      case 'student':
        return '#dc3545';
      case 'instructor':
        return '#ffc107';
      case 'support':
        return '#20c997';
      case 'editor':
        return '#9c27b0';
      case 'moderator':
        return '#000';
      default:
        return '#6c757d';
    }
  };

  const handleEdit = (user) => {
    const currentUserRole = getCurrentUserRole();
    if (currentUserRole == user.role && currentUserRole !== 'owner') {
      setIsOwnRole(true);
    }
    if (currentUserRole !== 'owner' && user.role === 'owner') {
      setSnackbarMessage('You cannot edit owner\'s profile.');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      return;
    }
    if (currentUserRole === 'manager' && user.role === 'admin') {
      setSnackbarMessage('You cannot edit admin\'s profile.');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      return;
    }
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || ''
    });
    setEditDialogOpen(true);
  };

  useEffect(() => {
    const checkCanEditRole = () => {
      if (getCurrentUserRole() === 'owner') {
        setCanEditRole(true);
      }
      else if (getCurrentUserRole() === 'admin') {
        setCanEditRole(true);
      }
      else {
        setCanEditRole(false);
      }
    }

    checkCanEditRole();
  }, []);
  const handleUpdateUser = async () => {
    try {
      const dataToSend = { ...formData };
      await api.put(`${BASE_URL}/users/${editingUser.id}`, dataToSend);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...dataToSend } : u));
      const currentUserName = localStorage.getItem('name');

      if (`"${editingUser.first_name}"` === currentUserName) {
        localStorage.removeItem('token');
        window.location.reload();
      } else {
        setEditDialogOpen(false);
        setSnackbarMessage('User updated successfully');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Error updating user');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = (user) => {
    const currentUserRole = getCurrentUserRole();
    if (currentUserRole !== 'owner' && user.role === 'owner') {
      setSnackbarMessage('You cannot remove the owner.');
      setSnackbarOpen(true);
      return;
    }
    if (currentUserRole === 'manager' && user.role === 'admin') {
      setSnackbarMessage('You cannot remove the admin.');
      setSnackbarOpen(true);
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleAddUser = () => {
    setAddDialogOpen(true);
  };

  const handleCreateUser = async () => {
    try {
      const dataToSend = { ...addFormData };
      //console.log("Creating user with data:", dataToSend);
      const response = await api.post(`${BASE_URL}/users`, dataToSend);
      setUsers([...users, response.data]);
      setAddDialogOpen(false);
      setAddFormData({ email: '', first_name: '', last_name: '', phone: '', role: '', password: '' });
      setSnackbarMessage('User created successfully');
      setSnackbarOpen(true);
      window.location.reload();
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Error creating user');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Header title="Management" />

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddUser}>
          Add Manager
        </Button>
      </Box>


      <CommonTable
        columns={[
          {
            name: "id",
            label: "ID",
            // render: (row) => (
               render: (row, index) => (
              <Box
                sx={{
                  color: 'black',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                {/* {row.id} */}
                {page * rowsPerPage + index + 1}
              </Box>
            ),
          },
          {
            name: "name",
            label: "Name",
            render: (row) => (
              <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 150 }}>
                <Avatar src={row.avatar} alt={row.name}>
                  {!row.avatar && row.first_name?.[0]?.toUpperCase()}
                </Avatar>
                <Box flex={1} textAlign="center">
                  {row.first_name} {row.last_name}
                </Box>
              </Box>
            ),
          },
          {
            name: "email",
            label: "Email",
            render: (row) => (
              <Box
                sx={{
                  color: 'black',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                {row.email}
              </Box>
            ),
          },
          {
            name: "phone",
            label: "Phone",
            render: (row) => (
              <Box
                sx={{
                  color: 'black',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                }}
              >
                {row.phone}
              </Box>
            ),
          },
          {
            name: "role",
            label: "Role",
            render: (row) => (
              <Box
                sx={{
                  bgcolor: getRoleColor(row.role),
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  display: 'inline-block',
                  fontWeight: 'bold',
                }}
              >
                {row.role}
              </Box>
            ),
          },
        ]}
        data={users}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={false}
        onPageChange={setPage}
        onRowsPerPageChange={(e) => setRowsPerPage(e.target.value)}
        actions={(user) => (
          <Box display="flex" gap={1}>
            <IconButton onClick={() => handleEdit(user)} title="Edit">
              <Edit fontSize="small" className="icon" sx={{ color: '#ff9800' }} />
            </IconButton>
            <IconButton onClick={() => handleDelete(user)} title="Delete">
              <Delete fontSize="small" className="icon" sx={{ color: '#f44336' }} />
            </IconButton>
          </Box>
        )}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: '#fff' }}>Confirm Delete</DialogTitle>
        <DialogContent sx={{ color: '#fff' }}>
          Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ borderColor: '#fff', color: '#fff' }}>Cancel</Button>
          <Button onClick={() => { deleteUser(userToDelete.id); setDeleteDialogOpen(false); }} variant="contained" sx={{ bgcolor: '#f44336', color: 'white' }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'white' }}>Edit User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <FormControl fullWidth sx={{ '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' } }}>
              <InputLabel id="role-label" sx={{ color: 'white' }}>Role</InputLabel>
              <Select
                labelId="role-label"
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                sx={{ color: 'white' }}
                disabled={!canEditRole || isOwnRole}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="owner">Owner</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined" sx={{ borderColor: '#fff', color: '#fff' }}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" sx={{ bgcolor: '#3322f', color: 'white' }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'white' }}>Add User</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="First Name"
              value={addFormData.first_name}
              onChange={(e) => setAddFormData({ ...addFormData, first_name: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Last Name"
              value={addFormData.last_name}
              onChange={(e) => setAddFormData({ ...addFormData, last_name: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Phone"
              value={addFormData.phone}
              onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Email"
              value={addFormData.email}
              onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={addFormData.password}
              onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputLabel-root': { color: 'white' },
                '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' },
                height: 40
              }}
              size="small"
            />
            <FormControl fullWidth sx={{ '& .MuiInputBase-root': { backgroundColor: '#424242', color: 'white' } }}>
              <InputLabel id="add-role-label" sx={{ color: 'white' }}>Role</InputLabel>
              <Select
                labelId="add-role-label"
                value={addFormData.role}
                label="Role"
                onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                sx={{ color: 'white' }}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="owner">Owner</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined" sx={{ borderColor: '#fff', color: '#fff' }}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" sx={{ bgcolor: '#3322f', color: 'white' }}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 1500 }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMessage.includes('success') ? 'success' : 'error'} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Management;
