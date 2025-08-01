import React from 'react';
interface FormFieldProps {
    label?: string;
    required?: boolean;
    error?: string;
    helper?: string;
    help?: string;
    children: React.ReactNode;
    className?: string;
    id?: string;
}
declare const FormField: React.FC<FormFieldProps>;
export { FormField };
