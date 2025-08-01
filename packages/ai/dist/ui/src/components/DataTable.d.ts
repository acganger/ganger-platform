import React from 'react';
interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}
interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    onRowClick?: (item: T) => void;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (key: string) => void;
}
declare function DataTable<T extends Record<string, any>>({ data, columns, loading, emptyMessage, className, onRowClick, sortBy, sortDirection, onSort, }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
export { DataTable };
export type { Column, DataTableProps };
//# sourceMappingURL=DataTable.d.ts.map