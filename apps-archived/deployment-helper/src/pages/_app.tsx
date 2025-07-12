import type { AppProps } from 'next/app';
import '../styles/globals.css';

function DeploymentHelperApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default DeploymentHelperApp;