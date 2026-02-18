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
            
            // Monitora atualizações do Service Worker
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Nova versão detectada, limpa caches e recarrega
                    console.log('Nova versão encontrada! Recarregando...');
                    if ('caches' in window) {
                      caches.keys().then((names) => {
                        for (const name of names) caches.delete(name);
                      });
                    }
                    window.location.reload();
                  }
                };
              }
            };
          },
          (err) => {
            console.log('Falha no SW:', err);
          }
        );
      });

      // Força a atualização se o Service Worker mudar
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
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
