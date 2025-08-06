// Type declarations for Next.js App Router features
// This allows the auth package to compile without requiring the full Next.js app context

declare module 'next/headers' {
  export interface RequestCookie {
    name: string;
    value: string;
  }

  export interface RequestCookies {
    get(name: string): RequestCookie | undefined;
    getAll(): RequestCookie[];
    has(name: string): boolean;
    set(name: string, value: string, options?: any): void;
    delete(name: string): void;
  }

  export function cookies(): RequestCookies;
  export function headers(): Headers;
}

declare module 'next/server' {
  export { NextRequest, NextResponse } from 'next/dist/server/web/spec-extension/request';
}