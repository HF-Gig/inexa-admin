import React from "react";
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  TablePagination,
  TableSortLabel,
} from "@mui/material";

/**
 * CommonTable - A reusable table component for admin panel
 *
 * Props:
 * - columns: Array<{ name, label, width?, align? }>
 *   You can pass a width property to set minWidth for a column.
 *   You can pass an align property ('left', 'center', 'right') to align the column.
 *   Example: { name: 'id', label: 'ID', width: 80, align: 'center' }
 *   If align is not provided, defaults to 'center'.
 * - data, total, page, rowsPerPage, onPageChange, onRowsPerPageChange, onSortChange, loading, actions
 */
const CELL_STYLE = {
  padding: "12px 16px",
  fontSize: 15,
  verticalAlign: "middle",
  borderBottom: "1px solid #e0e6ed",
};

const HEADER_CELL_STYLE = {
  ...CELL_STYLE,
  background: "#f8fafc",
  fontWeight: 700,
  color: "#2d3748",
  borderBottom: "2px solid #e0e6ed",
};

const CommonTable = ({
  columns,
  data,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading,
  actions,
  sx = {},
  sortCol,
  sortDir,
  onSortChange,
  actionsWidth, // new prop
}) => {
  const handleSort = (colName, sortable) => {
    if (!onSortChange || sortable === false) return;
    let direction = "asc";
    if (sortCol === colName && sortDir === "asc") direction = "desc";
    onSortChange(colName, direction);
  };

  return (
    <Paper
      sx={{
        background: "transparent",
        borderRadius: 3,
        boxShadow: "0 2px 16px 0 rgba(60,72,100,0.07)",
        overflow: "hidden",
        ...sx,
      }}
    >
      <TableContainer
        sx={{
          overflowX: "auto",
        }}
      >
        <Table stickyHeader sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                (() => {
                  const sortable = col.sortable !== false;
                  const enableSort = Boolean(onSortChange) && sortable;
                  return (
                    <TableCell
                      key={col.name}
                      align={col.align || "center"}
                      sx={{
                        ...HEADER_CELL_STYLE,
                        ...(col.width ? { width: col.width } : {}),
                        cursor: enableSort ? "pointer" : undefined,
                      }}
                      onClick={enableSort ? () => handleSort(col.name, sortable) : undefined}
                    >
                      {enableSort ? (
                        <TableSortLabel
                          active={sortCol === col.name}
                          direction={sortCol === col.name ? sortDir : "asc"}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  );
                })()
              ))}
              {actions && (
                <TableCell
                  align="center"
                  sx={{
                    ...HEADER_CELL_STYLE,
                    width: actionsWidth || 120,
                  }}
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="text.secondary">
                    No data found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? "#fcfdff" : "#f5f7fa",
                    transition: "background 0.2s ease-in-out",
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.name}
                      align={col.align || "center"}
                      sx={{
                        ...CELL_STYLE,
                        ...(col.width ? { width: col.width } : {}),
                      }}
                    >
                      {col.render ? col.render(row) : row[col.name]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell
                      align="center"
                      sx={{
                        ...CELL_STYLE,
                        width: actionsWidth || 120,
                      }}
                    >
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Pagination always at the bottom */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
        labelRowsPerPage="Rows per page:"
        sx={{
          background: "#f8fafc", // Light background
          borderTop: "1px solid #e0e6ed",
          borderRadius: 0, // Remove border radius
          px: 2,
          ".MuiTablePagination-toolbar": {
            minHeight: 40,
            background: "transparent",
            borderRadius: 0,
            p: 2,
          },
          ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
            fontSize: 14,
            color: "#2d3748",
          },
          ".MuiTablePagination-actions": { color: "#1976d2" },
          // Remove any dark background from parent
          "& .MuiInputBase-root": {
            background: "#fff",
            borderRadius: 1,
          },
        }}
      />
    </Paper>
  );
};

export default CommonTable; 