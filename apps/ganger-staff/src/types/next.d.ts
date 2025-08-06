/// <reference types="next" />

declare module 'next/router' {
  export { useRouter } from 'next/dist/client/router';
  export { default } from 'next/dist/client/router';
}

declare module 'next/app' {
  export type { AppProps } from 'next/dist/pages/_app';
}