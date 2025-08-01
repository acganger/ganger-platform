import React from 'react';
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}
interface ModalHeaderProps {
    children: React.ReactNode;
    className?: string;
}
interface ModalContentProps {
    children: React.ReactNode;
    className?: string;
}
interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}
declare const Modal: React.FC<ModalProps>;
declare const ModalHeader: React.FC<ModalHeaderProps>;
declare const ModalContent: React.FC<ModalContentProps>;
declare const ModalFooter: React.FC<ModalFooterProps>;
export { Modal, ModalHeader, ModalContent, ModalFooter };
//# sourceMappingURL=Modal.d.ts.map