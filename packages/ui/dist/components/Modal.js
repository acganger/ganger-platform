import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils/cn';
const Modal = ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true, }) => {
    React.useEffect(() => {
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
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: onClose }), _jsxs("div", { className: cn('relative bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden', sizeClasses[size], 'w-full mx-4'), children: [(title || showCloseButton) && (_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [title && (_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: title })), showCloseButton && (_jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] })), _jsx("div", { className: "overflow-y-auto max-h-[calc(90vh-140px)]", children: children })] })] }));
};
const ModalHeader = ({ children, className }) => (_jsx("div", { className: cn('px-6 py-4 border-b border-gray-200', className), children: children }));
const ModalContent = ({ children, className }) => (_jsx("div", { className: cn('px-6 py-4', className), children: children }));
const ModalFooter = ({ children, className }) => (_jsx("div", { className: cn('px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2', className), children: children }));
export { Modal, ModalHeader, ModalContent, ModalFooter };
