"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastContainer = exports.ToastProvider = exports.Toast = exports.useToast = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const cn_1 = require("../utils/cn");
const ToastContext = react_1.default.createContext(undefined);
const useToast = () => {
    const context = react_1.default.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
exports.useToast = useToast;
const Toast = ({ id, type = 'info', title, message, duration = 5000, onClose, }) => {
    react_1.default.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);
    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    const iconStyles = {
        success: 'text-green-400',
        error: 'text-red-400',
        warning: 'text-yellow-400',
        info: 'text-blue-400',
    };
    const icons = {
        success: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) })),
        error: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) })),
        warning: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) })),
        info: ((0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) })),
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all', typeStyles[type]), children: (0, jsx_runtime_1.jsx)("div", { className: "p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start", children: [(0, jsx_runtime_1.jsx)("div", { className: (0, cn_1.cn)('flex-shrink-0', iconStyles[type]), children: icons[type] }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-3 w-0 flex-1", children: [title && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium", children: title })), (0, jsx_runtime_1.jsx)("p", { className: (0, cn_1.cn)('text-sm', title ? 'mt-1' : ''), children: message })] }), (0, jsx_runtime_1.jsx)("div", { className: "ml-4 flex flex-shrink-0", children: (0, jsx_runtime_1.jsx)("button", { className: "inline-flex rounded-md p-1.5 min-h-[44px] min-w-[44px] items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-black/5", onClick: () => onClose(id), "aria-label": "Close notification", children: (0, jsx_runtime_1.jsx)("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) }) })] }) }) }));
};
exports.Toast = Toast;
const ToastContainer = ({ toasts }) => ((0, jsx_runtime_1.jsx)("div", { className: "fixed top-4 right-4 z-50 space-y-2", role: "region", "aria-label": "Notifications", "aria-live": "polite", children: toasts.map((toast) => ((0, jsx_runtime_1.jsx)(Toast, { ...toast }, toast.id))) }));
exports.ToastContainer = ToastContainer;
const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = react_1.default.useState([]);
    const removeToast = react_1.default.useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);
    const addToast = react_1.default.useCallback((toast) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = {
            ...toast,
            id,
            onClose: (toastId) => removeToast(toastId),
        };
        setToasts((prev) => [...prev, newToast]);
    }, [removeToast]);
    const contextValue = react_1.default.useMemo(() => ({
        toasts,
        addToast,
        removeToast,
    }), [toasts, addToast, removeToast]);
    return ((0, jsx_runtime_1.jsxs)(ToastContext.Provider, { value: contextValue, children: [children, (0, jsx_runtime_1.jsx)(ToastContainer, { toasts: toasts })] }));
};
exports.ToastProvider = ToastProvider;
