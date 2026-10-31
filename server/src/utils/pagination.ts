export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginationResult {
  limit: number;
  offset: number;
  page: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export function parsePagination(
  query: Record<string, unknown>,
  allowedSortColumns: string[],
  defaultSortColumn: string,
  defaultSortOrder: 'ASC' | 'DESC' = 'ASC'
): PaginationResult {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const rawLimit = parseInt(String(query.limit || '20'), 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const offset = (page - 1) * limit;

  const requestedSortBy = String(query.sortBy || '');
  const sortBy = allowedSortColumns.includes(requestedSortBy)
    ? requestedSortBy
    : defaultSortColumn;

  const rawOrder = String(query.sortOrder || '').toUpperCase();
  const sortOrder: 'ASC' | 'DESC' = rawOrder === 'DESC' ? 'DESC' : defaultSortOrder;

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
  };
}
