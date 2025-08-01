interface TrendData {
    value: number;
    direction: 'up' | 'down';
}
interface StatCardProps {
    title: string;
    value: string | number;
    icon?: string;
    trend?: TrendData;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}
export declare function StatCard({ title, value, icon, trend, variant, className }: StatCardProps): import("react/jsx-runtime").JSX.Element;
export {};
