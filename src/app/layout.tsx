'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registrado:', registration.scope);
          },
          (err) => {
            console.log('Falha no SW:', err);
          }
        );
      });
    }
  }, []);
  
  return (
    <html lang="pt-BR">
      <head>
        <title>Movimento Mensal - Gestão de Publicações</title>
        <meta name="description" content="Sistema inteligente para formulário S-28-T." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#A0CFEC" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/book192/192/192" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <PWAInstallPrompt />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}