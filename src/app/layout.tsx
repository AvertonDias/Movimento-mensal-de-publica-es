import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Inventário Fácil - Gestão Inteligente',
  description: 'Sistema de inventário personalizável com inteligência artificial.',
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<any>;
}) {
  // Unwrap params to satisfy Next.js 15 requirements even if not directly used
  await props.params;
  
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {props.children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
