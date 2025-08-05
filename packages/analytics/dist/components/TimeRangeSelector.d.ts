export type TimeRangeOption = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last7Days' | 'last30Days' | 'last90Days';
interface TimeRange {
    start: Date;
    end: Date;
    label: string;
}
interface TimeRangeSelectorProps {
    value: TimeRangeOption;
    onChange: (range: TimeRangeOption, dates: TimeRange) => void;
    options?: TimeRangeOption[];
    className?: string;
}
export declare function TimeRangeSelector({ value, onChange, options, className }: TimeRangeSelectorProps): import("react/jsx-runtime").JSX.Element;
export {};
