export type SortableKeys = 'id' | 'applicantName' | 'status' | 'statusChanged' | 'branch';
export type SortDirection = 'ascending' | 'descending';
export type SortConfig = { key: SortableKeys; direction: SortDirection } | null;
