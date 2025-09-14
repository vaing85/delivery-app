import React, { useState, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAccessibility, FocusManager } from '@/utils/accessibility';

export interface AccessibleTableColumn<T = any> {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  render?: (value: any, row: T) => React.ReactNode;
  getValue?: (row: T) => any;
}

export interface AccessibleTableProps<T = any> {
  columns: AccessibleTableColumn<T>[];
  data: T[];
  selectable?: boolean;
  sortable?: boolean;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  onRowAction?: (action: string, row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  className?: string;
}

export function AccessibleTable<T = any>({
  columns,
  data,
  selectable = false,
  sortable = true,
  onSort,
  onSelect,
  onRowClick,
  onRowAction,
  loading = false,
  emptyMessage = 'No data available',
  ariaLabel = 'Data table',
  ariaDescription,
  className,
}: AccessibleTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const { announce, ARIA_LABELS, ROLES } = useAccessibility();

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnId);
    setSortDirection(newDirection);
    
    announce(`Sorted by ${columns.find(c => c.id === columnId)?.label} ${newDirection}`, 'polite');
    onSort?.(columnId, newDirection);
  };

  // Handle row selection
  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows = checked ? [...data] : [];
    setSelectedRows(newSelectedRows);
    onSelect?.(newSelectedRows);
    
    announce(checked ? 'All rows selected' : 'All rows deselected', 'polite');
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelectedRows = checked
      ? [...selectedRows, row]
      : selectedRows.filter(r => r !== row);
    
    setSelectedRows(newSelectedRows);
    onSelect?.(newSelectedRows);
    
    announce(checked ? 'Row selected' : 'Row deselected', 'polite');
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, rowIndex: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedRowIndex(Math.min(rowIndex + 1, data.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedRowIndex(Math.max(rowIndex - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onRowClick) {
          onRowClick(data[rowIndex]);
        }
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (focusedRowIndex >= 0 && tableRef.current) {
      const focusedRow = tableRef.current.querySelector(`[data-row-index="${focusedRowIndex}"]`) as HTMLElement;
      focusedRow?.focus();
    }
  }, [focusedRowIndex]);

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <TableContainer component={Paper} className={className}>
      <Table
        ref={tableRef}
        role={ROLES.TABLE}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${ariaLabel}-description` : undefined}
        tabIndex={0}
      >
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label={ARIA_LABELS.SELECT_ALL_ROWS}
                />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ width: column.width }}
                sortDirection={sortColumn === column.id ? sortDirection : false}
              >
                {sortable && column.sortable !== false ? (
                  <TableSortLabel
                    active={sortColumn === column.id}
                    direction={sortColumn === column.id ? sortDirection : 'asc'}
                    onClick={() => handleSort(column.id)}
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  <Typography variant="subtitle2" component="span">
                    {column.label}
                  </Typography>
                )}
              </TableCell>
            ))}
            {onRowAction && (
              <TableCell align="right" padding="none">
                <Typography variant="caption" color="text.secondary">
                  Actions
                </Typography>
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (onRowAction ? 1 : 0)}>
                <Box display="flex" justifyContent="center" p={2}>
                  <Typography variant="body2" color="text.secondary">
                    {ARIA_LABELS.LOADING}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (onRowAction ? 1 : 0)}>
                <Box display="flex" justifyContent="center" p={2}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                data-row-index={rowIndex}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                onClick={() => onRowClick?.(row)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&:focus': {
                    backgroundColor: 'action.selected',
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: '-2px',
                  },
                }}
                aria-selected={selectedRows.includes(row)}
                role={ROLES.ROW}
              >
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(row)}
                      onChange={(e) => handleSelectRow(row, e.target.checked)}
                      aria-label={`${ARIA_LABELS.SELECT_ROW} ${rowIndex + 1}`}
                    />
                  </TableCell>
                )}
                {columns.map((column) => {
                  const value = column.getValue ? column.getValue(row) : (row as any)[column.id];
                  return (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      role={ROLES.CELL}
                    >
                      {column.render ? column.render(value, row) : value}
                    </TableCell>
                  );
                })}
                {onRowAction && (
                  <TableCell align="right" padding="none">
                    <Tooltip title="Row actions">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowAction('menu', row);
                        }}
                        aria-label={`${ARIA_LABELS.ROW_ACTIONS} for row ${rowIndex + 1}`}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {ariaDescription && (
        <Box id={`${ariaLabel}-description`} className="sr-only">
          {ariaDescription}
        </Box>
      )}
    </TableContainer>
  );
}

export default AccessibleTable;
