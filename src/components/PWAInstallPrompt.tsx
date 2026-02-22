'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { useUser } from "@/firebase";
import Image from "next/image";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      // Só mostra se não foi dispensado nesta sessão
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Se já estiver em modo standalone (instalado), não mostra nada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // LÓGICA PRINCIPAL: Se não há usuário logado ou está carregando, não mostra o prompt
  if (!isVisible || isUserLoading || !user || user.isAnonymous) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-10 duration-500">
      <Card className="bg-primary/95 backdrop-blur-md border-primary-foreground/20 shadow-2xl overflow-hidden text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl overflow-hidden w-[42px] h-[42px] border border-white/20 shadow-sm shrink-0">
              <Image 
                src="/icon.png" 
                alt="Logo" 
                width={42} 
                height={42} 
                className="object-cover w-full h-full" 
                unoptimized 
              />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-black uppercase tracking-tight">Instalar Movimento Mensal</p>
              <p className="text-[10px] font-bold uppercase opacity-80 leading-tight">
                Acesse mais rápido e preencha o formulário S-28-T mesmo offline.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="bg-white text-primary hover:bg-white/90 font-black uppercase text-[10px] tracking-widest h-8 px-4"
              >
                <Download className="h-3 w-3 mr-1.5" /> Instalar
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDismiss}
                className="h-8 w-8 text-primary-foreground/50 hover:text-primary-foreground hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
