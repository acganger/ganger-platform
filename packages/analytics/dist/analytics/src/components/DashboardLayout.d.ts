import { ReactNode } from 'react';
import { TimeRangeOption } from './TimeRangeSelector';
interface DashboardLayoutProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    timeRange?: TimeRangeOption;
    onTimeRangeChange?: (range: TimeRangeOption, dates: {
        start: Date;
        end: Date;
        label: string;
    }) => void;
    exportData?: any[];
    exportFilename?: string;
    actions?: ReactNode;
    className?: string;
}
export declare function DashboardLayout({ title, subtitle, children, timeRange, onTimeRangeChange, exportData, exportFilename, actions, className, }: DashboardLayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
