"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardContent = exports.CardDescription = exports.CardTitle = exports.CardFooter = exports.CardHeader = exports.Card = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
const Card = react_1.default.forwardRef(({ className, children, padding = 'md', shadow = 'sm', border = true, rounded = 'md', disabled = false, onClick, ...props }, ref) => {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };
    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        md: 'shadow-md',
        lg: 'shadow-lg',
    };
    const roundedClasses = {
        none: '',
        sm: 'rounded-sm',
        md: 'rounded-lg',
        lg: 'rounded-xl',
    };
    return ((0, jsx_runtime_1.jsx)("div", { ref: ref, className: (0, cn_1.cn)('bg-white text-gray-950', paddingClasses[padding], shadowClasses[shadow], roundedClasses[rounded], border && 'border border-gray-200', onClick && !disabled && 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200', disabled && 'opacity-50 cursor-not-allowed', className), onClick: onClick && !disabled ? onClick : undefined, ...props, children: children }));
});
exports.Card = Card;
Card.displayName = 'Card';
const CardHeader = react_1.default.forwardRef(({ className, children, ...props }, ref) => ((0, jsx_runtime_1.jsx)("div", { ref: ref, className: (0, cn_1.cn)('flex flex-col space-y-1.5 pb-4 mb-4', className), ...props, children: children })));
exports.CardHeader = CardHeader;
CardHeader.displayName = 'CardHeader';
const CardTitle = react_1.default.forwardRef(({ className, children, size = 'md', ...props }, ref) => {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
    };
    return ((0, jsx_runtime_1.jsx)("h3", { ref: ref, className: (0, cn_1.cn)(sizeClasses[size], 'font-semibold leading-none tracking-tight text-gray-900', className), ...props, children: children }));
});
exports.CardTitle = CardTitle;
CardTitle.displayName = 'CardTitle';
const CardDescription = react_1.default.forwardRef(({ className, children, ...props }, ref) => ((0, jsx_runtime_1.jsx)("p", { ref: ref, className: (0, cn_1.cn)('text-sm text-gray-500', className), ...props, children: children })));
exports.CardDescription = CardDescription;
CardDescription.displayName = 'CardDescription';
const CardContent = react_1.default.forwardRef(({ className, children, ...props }, ref) => ((0, jsx_runtime_1.jsx)("div", { ref: ref, className: (0, cn_1.cn)('pt-0', className), ...props, children: children })));
exports.CardContent = CardContent;
CardContent.displayName = 'CardContent';
const CardFooter = react_1.default.forwardRef(({ className, children, ...props }, ref) => ((0, jsx_runtime_1.jsx)("div", { ref: ref, className: (0, cn_1.cn)('flex items-center pt-4 mt-4 border-t border-gray-200', className), ...props, children: children })));
exports.CardFooter = CardFooter;
CardFooter.displayName = 'CardFooter';
