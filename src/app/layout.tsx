import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth/auth-provider';
import InvitationProcessingLoader from '@/components/auth/invitation-processing-loader';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { PreferencesProvider } from '@/contexts/preferences-context';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'VulnScope - Vulnerability Tracking and Intelligence Platform',
  description:
    'Track, classify, and understand vulnerabilities in open source software with advanced threat intelligence for modern security teams.',
  keywords:
    'vulnerability management, security, CVE, threat intelligence, security platform, vulnerability tracking, cyber intelligence',
  authors: [{ name: 'VulnScope Team' }],
  creator: 'VulnScope',
  publisher: 'VulnScope',
  generator: 'v0.dev',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: 'https://cdn.qwenlm.ai/output/97c7d9b0-9492-4b89-af6b-329c10e0d7ba/t2i/03bc572b-f7b1-49a9-982f-5370e542fb9a/1ececf3e-7524-440d-80c5-72aa7c1b960e.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiOTdjN2Q5YjAtOTQ5Mi00Yjg5LWFmNmItMzI5YzEwZTBkN2JhIiwicmVzb3VyY2VfaWQiOiIxZWNlY2YzZS03NTI0LTQ0MGQtODBjNS03MmFhN2MxYjk2MGUiLCJyZXNvdXJjZV9jaGF0X2lkIjpudWxsfQ.ehTxDiRIkZhqQl6iH0SwTRPI3lUDAmdLqSpVw4xOtyQ',
    shortcut:
      'https://cdn.qwenlm.ai/output/97c7d9b0-9492-4b89-af6b-329c10e0d7ba/t2i/03bc572b-f7b1-49a9-982f-5370e542fb9a/1ececf3e-7524-440d-80c5-72aa7c1b960e.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiOTdjN2Q5YjAtOTQ5Mi00Yjg5LWFmNmItMzI5YzEwZTBkN2JhIiwicmVzb3VyY2VfaWQiOiIxZWNlY2YzZS03NTI0LTQ0MGQtODBjNS03MmFhN2MxYjk2MGUiLCJyZXNvdXJjZV9jaGF0X2lkIjpudWxsfQ.ehTxDiRIkZhqQl6iH0SwTRPI3lUDAmdLqSpVw4xOtyQ',
    apple:
      'https://cdn.qwenlm.ai/output/97c7d9b0-9492-4b89-af6b-329c10e0d7ba/t2i/03bc572b-f7b1-49a9-982f-5370e542fb9a/1ececf3e-7524-440d-80c5-72aa7c1b960e.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiOTdjN2Q5YjAtOTQ5Mi00Yjg5LWFmNmItMzI5YzEwZTBkN2JhIiwicmVzb3VyY2VfaWQiOiIxZWNlY2YzZS03NTI0LTQ0MGQtODBjNS03MmFhN2MxYjk2MGUiLCJyZXNvdXJjZV9jaGF0X2lkIjpudWxsfQ.ehTxDiRIkZhqQl6iH0SwTRPI3lUDAmdLqSpVw4xOtyQ',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <PreferencesProvider>
            <ThemeProvider>
              {children}
              <InvitationProcessingLoader />
              <Toaster />
            </ThemeProvider>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
