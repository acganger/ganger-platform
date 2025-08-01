"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Progress = Progress;
exports.ProgressLegacy = ProgressLegacy;
var jsx_runtime_1 = require("react/jsx-runtime");
var clsx_1 = require("../utils/clsx");
var styles = {
    base: [
        // Base progress container
        'relative h-2 w-full overflow-hidden rounded-full bg-zinc-200',
        // Dark mode
        'dark:bg-zinc-800',
    ],
    bar: [
        // Base progress bar
        'h-full transition-all duration-300 ease-in-out',
        // Smooth animations
        'transition-[width]',
    ],
    colors: {
        zinc: [
            'bg-zinc-600',
            'dark:bg-zinc-400',
        ],
        indigo: [
            'bg-indigo-600',
            'dark:bg-indigo-500',
        ],
        cyan: [
            'bg-cyan-500',
            'dark:bg-cyan-400',
        ],
        red: [
            'bg-red-600',
            'dark:bg-red-500',
        ],
        orange: [
            'bg-orange-500',
            'dark:bg-orange-400',
        ],
        amber: [
            'bg-amber-500',
            'dark:bg-amber-400',
        ],
        yellow: [
            'bg-yellow-500',
            'dark:bg-yellow-400',
        ],
        lime: [
            'bg-lime-500',
            'dark:bg-lime-400',
        ],
        green: [
            'bg-green-600',
            'dark:bg-green-500',
        ],
        emerald: [
            'bg-emerald-600',
            'dark:bg-emerald-500',
        ],
        teal: [
            'bg-teal-600',
            'dark:bg-teal-500',
        ],
        sky: [
            'bg-sky-500',
            'dark:bg-sky-400',
        ],
        blue: [
            'bg-blue-600',
            'dark:bg-blue-500',
        ],
        violet: [
            'bg-violet-500',
            'dark:bg-violet-400',
        ],
        purple: [
            'bg-purple-500',
            'dark:bg-purple-400',
        ],
        fuchsia: [
            'bg-fuchsia-500',
            'dark:bg-fuchsia-400',
        ],
        pink: [
            'bg-pink-500',
            'dark:bg-pink-400',
        ],
        rose: [
            'bg-rose-500',
            'dark:bg-rose-400',
        ],
    },
};
function Progress(_a) {
    var value = _a.value, _b = _a.max, max = _b === void 0 ? 100 : _b, className = _a.className, _c = _a.color, color = _c === void 0 ? 'blue' : _c;
    var percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, clsx_1.clsx)(className, styles.base), role: "progressbar", "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": max, "aria-label": "Progress: ".concat(Math.round(percentage), "%"), children: (0, jsx_runtime_1.jsx)("div", { className: (0, clsx_1.clsx)(styles.bar, styles.colors[color]), style: { width: "".concat(percentage, "%") } }) }));
}
function ProgressLegacy(_a) {
    var value = _a.value, _b = _a.max, max = _b === void 0 ? 100 : _b, className = _a.className, _c = _a.variant, variant = _c === void 0 ? 'default' : _c;
    // Map legacy variants to Catalyst colors
    var colorMap = {
        default: 'blue',
        success: 'green',
        warning: 'yellow',
        danger: 'red',
    };
    return ((0, jsx_runtime_1.jsx)(Progress, { value: value, max: max, className: className, color: colorMap[variant] }));
}
