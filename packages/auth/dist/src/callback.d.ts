import React from 'react';
interface AuthCallbackProps {
    appName?: string;
    defaultRedirect?: string;
    onSuccess?: (user: any) => void;
    onError?: (error: Error) => void;
}
export declare function AuthCallback({ appName, defaultRedirect, onSuccess, onError }: AuthCallbackProps): import("react/jsx-runtime").JSX.Element | null;
export declare function withAuthCallback<P extends object>(Component: React.ComponentType<P>, callbackProps?: Omit<AuthCallbackProps, 'children'>): (props: P) => import("react/jsx-runtime").JSX.Element;
export default AuthCallback;
