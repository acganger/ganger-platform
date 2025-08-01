declare const styles: {
    base: string[];
    bar: string[];
    colors: {
        zinc: string[];
        indigo: string[];
        cyan: string[];
        red: string[];
        orange: string[];
        amber: string[];
        yellow: string[];
        lime: string[];
        green: string[];
        emerald: string[];
        teal: string[];
        sky: string[];
        blue: string[];
        violet: string[];
        purple: string[];
        fuchsia: string[];
        pink: string[];
        rose: string[];
    };
};
export interface ProgressProps {
    /** The progress value (0-100) */
    value: number;
    /** Maximum value (defaults to 100) */
    max?: number;
    /** Additional CSS classes */
    className?: string;
    /** Color variant following Catalyst design system */
    color?: keyof typeof styles.colors;
}
export declare function Progress({ value, max, className, color }: ProgressProps): import("react/jsx-runtime").JSX.Element;
export interface ProgressLegacyProps {
    value: number;
    max?: number;
    className?: string;
    /** @deprecated Use 'color' prop instead */
    variant?: 'default' | 'success' | 'warning' | 'danger';
}
export declare function ProgressLegacy({ value, max, className, variant }: ProgressLegacyProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=progress.d.ts.map