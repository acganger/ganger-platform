import { ExportOptions } from '../types';
import 'jspdf-autotable';
interface ExportButtonProps {
    data: any[];
    filename: string;
    title?: string;
    className?: string;
    onExport?: (options: ExportOptions) => void;
    formats?: ('pdf' | 'excel' | 'csv')[];
}
export declare function ExportButton({ data, filename, title, className, onExport, formats, }: ExportButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
