export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    id?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
}
export declare function Switch({ checked, onChange, disabled, size, className, id, ...ariaProps }: SwitchProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Switch.d.ts.map