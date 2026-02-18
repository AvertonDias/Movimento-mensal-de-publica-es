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
    icon: '/icon.png',
    apple: '/icon.png',
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
  maximumScale: 1, // Limita o zoom máximo para evitar distorções de layout na rotação
  userScalable: false, // Desativa o pinch-to-zoom para manter a experiência de app nativo estável
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
