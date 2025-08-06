import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Check-in kiosk is a public app - no authentication needed
  return <Component {...pageProps} />;
}