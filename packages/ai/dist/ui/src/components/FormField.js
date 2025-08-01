"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormField = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
const FormField = ({ label, required, error, helper, help, children, className, id, }) => {
    // Use help as alias for helper if provided
    const helperText = help || helper;
    // Generate unique IDs for accessibility
    const generatedId = react_1.default.useId();
    const fieldId = id || generatedId;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    // Clone children to add accessibility attributes
    const enhancedChildren = react_1.default.cloneElement(children, {
        id: fieldId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': [
            error ? errorId : null,
            helperText ? helperId : null
        ].filter(Boolean).join(' ') || undefined,
        'aria-required': required ? 'true' : undefined,
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, cn_1.cn)('space-y-2', className), children: [label && ((0, jsx_runtime_1.jsxs)("label", { htmlFor: fieldId, className: "block text-sm font-medium text-gray-700", children: [label, required && (0, jsx_runtime_1.jsx)("span", { className: "text-red-500 ml-1", "aria-label": "required", children: "*" })] })), (0, jsx_runtime_1.jsx)("div", { children: enhancedChildren }), error && ((0, jsx_runtime_1.jsx)("p", { id: errorId, className: "text-sm text-red-600", role: "alert", "aria-live": "polite", children: error })), helperText && !error && ((0, jsx_runtime_1.jsx)("p", { id: helperId, className: "text-sm text-gray-500", children: helperText }))] }));
};
exports.FormField = FormField;
