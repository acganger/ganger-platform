import type { AppProps } from 'next/app';
import '../styles/globals.css';

// Import all packages to ensure they're built
import * as auth from '@ganger/auth';
import * as ui from '@ganger/ui';
import * as db from '@ganger/db';
import * as utils from '@ganger/utils';
import * as types from '@ganger/types';
import * as integrations from '@ganger/integrations';
import * as monitoring from '@ganger/monitoring';
import * as cache from '@ganger/cache';

// Import commonly missing dependencies
import 'framer-motion';
import 'react-chartjs-2';
import 'chart.js';
import '@supabase/ssr';
import '@supabase/supabase-js';

function DeploymentHelperApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default DeploymentHelperApp;