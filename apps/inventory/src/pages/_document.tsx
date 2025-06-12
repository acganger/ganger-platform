import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Ganger Platform - Inventory Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Inventory app CSS variables */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --inventory-primary: 37 99 235;
              --inventory-secondary: 16 185 129;
              --inventory-accent: 147 51 234;
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