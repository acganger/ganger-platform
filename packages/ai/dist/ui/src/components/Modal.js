"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalFooter = exports.ModalContent = exports.ModalHeader = exports.Modal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
const Modal = ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true, }) => {
    react_1.default.useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: onClose }), (0, jsx_runtime_1.jsxs)("div", { className: (0, cn_1.cn)('relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden', sizeClasses[size], 'w-full mx-4'), children: [(title || showCloseButton) && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [title && ((0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900", children: title })), showCloseButton && ((0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] })), (0, jsx_runtime_1.jsx)("div", { className: "overflow-y-auto max-h-[calc(90vh-140px)]", children: children })] })] }));
};
exports.Modal = Modal;
const ModalHeader = ({ children, className }) => ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('px-6 py-4 border-b border-gray-200', className), children: children }));
exports.ModalHeader = ModalHeader;
const ModalContent = ({ children, className }) => ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('px-6 py-4', className), children: children }));
exports.ModalContent = ModalContent;
const ModalFooter = ({ children, className }) => ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2', className), children: children }));
exports.ModalFooter = ModalFooter;
