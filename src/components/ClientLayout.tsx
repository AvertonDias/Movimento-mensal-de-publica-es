'use client';

import React, { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registrado:', registration.scope);
            
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background flex flex-col min-h-screen">
          <Header />
          <div className="flex-1 flex flex-col">
            {children}
            <Footer />
          </div>
          <Toaster />
          <PWAInstallPrompt />
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}