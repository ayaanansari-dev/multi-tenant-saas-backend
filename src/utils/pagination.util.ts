export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export const getPaginationParams = (params: CursorPaginationParams) => {
  const limit = Math.min(params.limit || 50, 100);
  const orderBy = params.orderBy || 'desc';
  
  return { limit, orderBy };
};

export const encodeCursor = (id: string, timestamp: Date): string => {
  const data = `${timestamp.getTime()}:${id}`;
  return Buffer.from(data).toString('base64');
};

export const decodeCursor = (cursor: string): { id: string; timestamp: Date } => {
  const decoded = Buffer.from(cursor, 'base64').toString();
  const [timestamp, id] = decoded.split(':');
  return { id, timestamp: new Date(parseInt(timestamp)) };
};