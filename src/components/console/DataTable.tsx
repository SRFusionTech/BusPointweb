'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  Box, Button, Card, Divider, Group, Skeleton, Stack, Table, Text, TextInput, ThemeIcon,
} from '@mantine/core';
import { IconSearch, IconSearchOff } from '@tabler/icons-react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  width?: CSSProperties['width'];
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  renderMobileRow: (row: T) => ReactNode;
  /** Unfiltered count — drives the empty state and the footer. */
  totalCount: number;
  noun: [singular: string, plural: string];
  emptyState: ReactNode;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  filters?: ReactNode;
  onClearFilters?: () => void;
  minWidth?: number;
}

const headerCell: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--mantine-color-dimmed)',
  background: 'var(--mantine-color-default-hover)',
  whiteSpace: 'nowrap',
  height: 40,
};

const stop = (e: React.MouseEvent) => e.stopPropagation();

export function DataTable<T>({
  data, columns, rowKey, renderMobileRow, totalCount, noun, emptyState, loading,
  onRowClick, rowActions, search, filters, onClearFilters, minWidth = 720,
}: DataTableProps<T>) {
  const isEmpty = !loading && totalCount === 0;
  const noMatches = !loading && totalCount > 0 && data.length === 0;
  const colCount = columns.length + (rowActions ? 1 : 0);

  return (
    <Card withBorder padding={0} radius="md">
      {!isEmpty && (search || filters) && (
        <>
          <Group justify="space-between" gap="sm" p="sm" wrap="wrap">
            {search && (
              <TextInput
                value={search.value}
                onChange={(e) => search.onChange(e.currentTarget.value)}
                placeholder={search.placeholder ?? 'Search…'}
                leftSection={<IconSearch size={16} stroke={1.75} />}
                w={{ base: '100%', sm: 300 }}
                aria-label="Search"
              />
            )}
            {filters}
          </Group>
          <Divider />
        </>
      )}

      {isEmpty ? (
        emptyState
      ) : noMatches ? (
        <Stack align="center" gap={6} py={48} px="md">
          <ThemeIcon variant="light" color="gray" size={40} radius="md">
            <IconSearchOff size={20} stroke={1.5} />
          </ThemeIcon>
          <Text fw={600} size="sm" mt={4}>No {noun[1]} match your filters</Text>
          <Text size="xs" c="dimmed">Try a different search term or clear the filters.</Text>
          {onClearFilters && (
            <Button variant="default" size="xs" mt="xs" onClick={onClearFilters}>Clear filters</Button>
          )}
        </Stack>
      ) : (
        <>
          <Box visibleFrom="sm" style={{ overflowX: 'auto' }}>
            <Table
              highlightOnHover={!loading}
              verticalSpacing={12}
              horizontalSpacing="md"
              style={{ minWidth }}
            >
              <Table.Thead>
                <Table.Tr>
                  {columns.map((c) => (
                    <Table.Th key={c.key} style={{ ...headerCell, width: c.width }}>{c.header}</Table.Th>
                  ))}
                  {rowActions && <Table.Th style={{ ...headerCell, width: 56 }} />}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Table.Tr key={i}>
                        {Array.from({ length: colCount }).map((__, j) => (
                          <Table.Td key={j}><Skeleton h={14} w={j === 0 ? '70%' : '50%'} /></Table.Td>
                        ))}
                      </Table.Tr>
                    ))
                  : data.map((row) => (
                      <Table.Tr
                        key={rowKey(row)}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                        style={onRowClick ? { cursor: 'pointer' } : undefined}
                      >
                        {columns.map((c) => <Table.Td key={c.key}>{c.render(row)}</Table.Td>)}
                        {rowActions && (
                          <Table.Td onClick={stop} ta="right">{rowActions(row)}</Table.Td>
                        )}
                      </Table.Tr>
                    ))}
              </Table.Tbody>
            </Table>
          </Box>

          <Box hiddenFrom="sm">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} p="md">
                    <Skeleton h={14} w="60%" mb={8} />
                    <Skeleton h={10} w="40%" />
                  </Box>
                ))
              : data.map((row, i) => (
                  <Box key={rowKey(row)}>
                    {i > 0 && <Divider />}
                    <Group
                      wrap="nowrap"
                      gap="sm"
                      p="md"
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      style={onRowClick ? { cursor: 'pointer' } : undefined}
                    >
                      <Box style={{ flex: 1, minWidth: 0 }}>{renderMobileRow(row)}</Box>
                      {rowActions && <Box onClick={stop}>{rowActions(row)}</Box>}
                    </Group>
                  </Box>
                ))}
          </Box>

          <Divider />
          <Group justify="space-between" px="md" py={10}>
            <Text size="xs" c="dimmed">
              {loading
                ? 'Loading…'
                : data.length === totalCount
                  ? `${totalCount} ${totalCount === 1 ? noun[0] : noun[1]}`
                  : `Showing ${data.length} of ${totalCount} ${noun[1]}`}
            </Text>
          </Group>
        </>
      )}
    </Card>
  );
}
