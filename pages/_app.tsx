import "@/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import React, { useState, useEffect, ReactElement } from 'react';
import type { AppProps } from "next/app";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider } from "next-themes";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";
import { wagmiConfig, chains } from '@config/wallet';
import Head from 'next/head';

/**
 * Renders the Felina component with the given AppProps.
 *
 * @param {AppProps} Component - The component to be rendered
 * @param {AppProps} pageProps - The props for the component
 * @return {JSX.Element} The rendered Felina component
 */
function Felina({ Component, pageProps }: AppProps) {
  const appInfo = { appName: "Felina Protocol" };
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <Head>
        <title>{appInfo.appName}</title>
        <meta name="Felina Protocol" content="Felina Protocol" />
      </Head>
      <NextUIProvider>
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider appInfo={appInfo} chains={chains} theme={darkTheme()}>
            <ThemeProvider>
              <Component {...pageProps} />
              {isClient && <SpeedInsights />}
              {isClient && <Analytics />}
            </ThemeProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </NextUIProvider>
    </>
  );
}

export default Felina;
