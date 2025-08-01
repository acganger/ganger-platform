export interface ProgressProps {
    value: number;
    max?: number;
    className?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}
export declare function Progress({ value, max, className, variant }: ProgressProps): import("react/jsx-runtime").JSX.Element;
