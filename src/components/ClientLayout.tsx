'use client';

import React, { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Header } from '@/components/Header';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
    <FirebaseClientProvider>
      <Header />
      {children}
      <Toaster />
      <PWAInstallPrompt />
    </FirebaseClientProvider>
  );
}
