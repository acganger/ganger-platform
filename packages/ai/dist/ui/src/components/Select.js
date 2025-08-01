"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
const Select = react_1.default.forwardRef(({ className, label, error, helper, options, placeholder, ...props }, ref) => {
    const selectId = react_1.default.useId();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [label && ((0, jsx_runtime_1.jsx)("label", { htmlFor: selectId, className: "block text-sm font-medium text-gray-700", children: label })), (0, jsx_runtime_1.jsxs)("select", { id: selectId, className: (0, cn_1.cn)('flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', error && 'border-red-500 focus-visible:ring-red-500', className), ref: ref, ...props, children: [placeholder && ((0, jsx_runtime_1.jsx)("option", { value: "", disabled: true, children: placeholder })), options.map((option) => ((0, jsx_runtime_1.jsx)("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)))] }), error && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: error })), helper && !error && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: helper }))] }));
});
exports.Select = Select;
Select.displayName = 'Select';
