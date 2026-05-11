import type { Metadata, Viewport } from 'next'
import { Script } from 'next/script'
import './globals.css'
import { Providers } from './providers'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'

export const metadata: Metadata = {
  title: {
    default: 'ReZ Try - Discover & Experience Before You Decide',
    template: '%s | ReZ Try',
  },
  description: 'Try new experiences, pay less, get rewarded. The smart way to explore your city with gamified trials, coins, and missions.',
  keywords: [
    'trials',
    'experiences',
    'try before buy',
    'discover',
    'rewards',
    'coins',
    'gamification',
    'local businesses',
    'explore city',
  ],
  authors: [{ name: 'ReZ' }],
  creator: 'ReZ',
  publisher: 'ReZ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ReZ Try',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://try.rez.money',
    siteName: 'ReZ Try',
    title: 'ReZ Try - Discover & Experience Before You Decide',
    description: 'Try new experiences, pay less, get rewarded.',
    images: [
      {
        url: '/icons/icon-512.svg',
        width: 512,
        height: 512,
        alt: 'ReZ Try',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReZ Try',
    description: 'Try new experiences, pay less, get rewarded.',
    images: ['/icons/icon-512.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="icon" href="/favicon.svg" sizes="any" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
