
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, BookOpen } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Impede o mini-infobar automático do Chrome
      e.preventDefault();
      // Guarda o evento para disparar depois
      setDeferredPrompt(e);
      // Verifica se o usuário já fechou o banner nesta sessão
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se já está instalado (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt nativo
    deferredPrompt.prompt();

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-10 duration-500">
      <Card className="bg-primary/95 backdrop-blur-md border-primary-foreground/20 shadow-2xl overflow-hidden text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-black uppercase tracking-tight">Instalar Movimento Mensal</p>
              <p className="text-[10px] font-bold uppercase opacity-80 leading-tight">
                Acesse mais rápido e preencha o formulário S-28-T mesmo offline.
              </p>
            </div>
            <div className="flex items-center gap-2">
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
