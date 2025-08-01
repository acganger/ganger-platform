"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checkbox = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
const Checkbox = react_1.default.forwardRef(({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = react_1.default.useId();
    const checkboxId = id || generatedId;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center h-5", children: (0, jsx_runtime_1.jsx)("input", { id: checkboxId, type: "checkbox", className: (0, cn_1.cn)('h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0', error && 'border-red-500', className), ref: ref, ...props }) }), (label || description) && ((0, jsx_runtime_1.jsxs)("div", { className: "text-sm", children: [label && ((0, jsx_runtime_1.jsx)("label", { htmlFor: checkboxId, className: (0, cn_1.cn)('font-medium text-gray-700 cursor-pointer', error && 'text-red-700'), children: label })), description && ((0, jsx_runtime_1.jsx)("p", { className: (0, cn_1.cn)('text-gray-500', label && 'mt-1'), children: description }))] }))] }), error && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600 ml-7", children: error }))] }));
});
exports.Checkbox = Checkbox;
Checkbox.displayName = 'Checkbox';
