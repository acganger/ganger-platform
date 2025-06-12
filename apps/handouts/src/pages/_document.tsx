import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Ganger Platform - Rapid Custom Handouts Generator" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        
        {/* Handouts app CSS variables */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --handouts-primary: 124 58 237;
              --handouts-secondary: 16 185 129;
              --handouts-accent: 245 101 101;
              --handouts-education: 249 115 22;
              --handouts-treatment: 34 197 94;
              --handouts-medication: 168 85 247;
              --handouts-procedure: 59 130 246;
            }
            
            .camera-overlay {
              position: relative;
              overflow: hidden;
            }
            
            .scan-line {
              position: absolute;
              width: 100%;
              height: 2px;
              background: linear-gradient(90deg, transparent, #7c3aed, transparent);
              animation: scan 2s ease-in-out infinite;
            }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}