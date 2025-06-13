import type { AppProps } from 'next/app';
import { ThemeProvider } from '@ganger/ui';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="component-showcase-theme">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}