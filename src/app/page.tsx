'use client';

import React, { useState, useEffect } from 'react';
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import Image from "next/image";
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'personal' | 'shared'>('personal');
  const [sharedOwnerId, setSharedOwnerId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite } = useDoc(helperInviteRef);
  const isHelper = !!helperInvite;

  useEffect(() => {
    if (isHelper && helperInvite?.ownerId) {
      setViewMode('shared');
      setSharedOwnerId(helperInvite.ownerId);
    } else {
      setViewMode('personal');
    }
  }, [isHelper, helperInvite]);

  // Estrutura neutra para o primeiro render (SSR e Hydration) para evitar erros do Next.js
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  // Tela de carregamento exibida apenas após a hidratação bem-sucedida
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-6">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden w-[64px] h-[64px] shadow-2xl">
              <Image 
                src="/icon.png" 
                alt="Logo S-28 Digital" 
                width={64} 
                height={64} 
                className="object-cover w-full h-full" 
                unoptimized 
                priority 
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Sincronizando</p>
            <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">Preparando ambiente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeUserId = (viewMode === 'shared' && sharedOwnerId) ? sharedOwnerId : user.uid;

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 space-y-8 overflow-hidden">
        {isHelper && (
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent-foreground shrink-0" />
              <div>
                <p className="text-xs font-black uppercase text-accent-foreground">Acesso Autorizado</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Você está ajudando a gerenciar este inventário.</p>
              </div>
            </div>
          </div>
        )}
        <div className="w-full overflow-hidden">
          <InventoryTable targetUserId={activeUserId} />
        </div>
      </main>
    </div>
  );
}
