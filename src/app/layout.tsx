import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'S-28 Digital: Gestão inteligente de publicações',
  description: 'Sistema inteligente para formulário S-28-T e gestão de estoque.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'S-28 Digital',
  },
};

export const viewport: Viewport = {
  themeColor: '#A0CFEC',
  width: 'device-width',
  initialScale: 1,
  // Mantendo escala fluida para acessibilidade, mas estabilizada pelo globals.css
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${ptSans.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
