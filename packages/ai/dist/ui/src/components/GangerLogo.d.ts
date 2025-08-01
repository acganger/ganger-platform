interface GangerLogoProps {
    /** Logo size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Whether to show just the icon or full logo */
    variant?: 'icon' | 'full';
    /** Custom className */
    className?: string;
    /** Whether logo should be clickable */
    href?: string;
}
export declare function GangerLogo({ size, variant, className, href }: GangerLogoProps): import("react/jsx-runtime").JSX.Element;
/**
 * Professional header component with Ganger Dermatology branding
 */
interface GangerHeaderProps {
    title?: string;
    subtitle?: string;
    className?: string;
}
export declare function GangerHeader({ title, subtitle, className }: GangerHeaderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Compact logo for sidebars and small spaces
 */
export declare function GangerLogoCompact({ className }: {
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=GangerLogo.d.ts.map