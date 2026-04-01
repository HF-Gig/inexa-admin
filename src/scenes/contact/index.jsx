import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { CheckCircle, Cancel, Delete } from '@mui/icons-material';
import { Header } from '../../components';
import CommonTable from '../../components/CommonTable';
import api from '../../helpers/api';

const Contact = () => {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState(''); // 🔥 new

  useEffect(() => {
    fetchForms();
  }, [page, rowsPerPage, statusFilter]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/contact/get-forms?page=${page + 1}&page_size=${rowsPerPage}${statusFilter ? `&status=${statusFilter}` : ''}`);
      setContacts(res.data.data || []);
      setTotal(res.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'completed':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#6c757d';
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/contact/${id}/status`, { status });
      fetchForms();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = (contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/contact/${contactToDelete.id}`);
      fetchForms();
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <Box>
      <Header title="Contacts" />

      {/* 🔥 Status Filter Dropdown */}
      <Box mb={2}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <CommonTable
        columns={[
          { name: 'id', label: 'No.', render: (row, index) => page * rowsPerPage + index + 1 },
          { name: 'name', label: 'Name' },
          { name: 'email', label: 'Email' },
          { name: 'phone', label: 'Phone' },
          { name: 'country', label: 'Country' },
          {
            name: 'message',
            label: 'Message',
            render: (row) =>
              row.message.length > 50
                ? row.message.substring(0, 50) + '...'
                : row.message,
          },
          {
            name: 'status',
            label: 'Status',
            render: (row) => (
              <Box
                sx={{
                  bgcolor: getStatusColor(row.status),
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  display: 'inline-block',
                  fontWeight: 'bold',
                }}
              >
                {row.status}
              </Box>
            ),
          },
          { name: 'whatsapp_call', label: 'WhatsApp Call' },
          {
            name: 'create_time',
            label: 'Created',
            render: (row) => new Date(row.create_time).toLocaleString(),
          },
        ]}
        data={contacts} // 👈 filtered by backend
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        loading={loading}
        onPageChange={setPage}
        onRowsPerPageChange={(e) => setRowsPerPage(e.target.value)}
        actions={(contact) => (
          <Box display="flex" gap={1}>
            {contact.status === 'pending' && (
              <>
                <IconButton
                  onClick={() => handleStatusUpdate(contact.id, 'completed')}
                  title="Mark as Completed"
                  sx={{ color: '#4caf50' }}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleStatusUpdate(contact.id, 'rejected')}
                  title="Mark as Rejected"
                  sx={{ color: '#f44336' }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </>
            )}
            <IconButton
              onClick={() => handleDelete(contact)}
              title="Delete"
              sx={{ color: '#f44336' }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: '#fff' }}>Confirm Delete</DialogTitle>
        <DialogContent sx={{ color: '#fff' }}>
          Are you sure you want to delete this entry? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button sx={{ color: '#fff' }} onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contact;