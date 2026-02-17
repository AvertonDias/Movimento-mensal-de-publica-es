'use client';

import React, { useState, useEffect } from 'react';
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

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

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl animate-pulse w-[40px] h-[40px] overflow-hidden">
            <Image src="/icon.png" alt="Carregando" width={40} height={40} className="object-cover w-full h-full" unoptimized priority />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeUserId = (viewMode === 'shared' && sharedOwnerId) ? sharedOwnerId : user.uid;

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body">
      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-8">
        {isHelper && (
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
              <div>
                <p className="text-xs font-black uppercase text-accent-foreground">Acesso Autorizado</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Você está ajudando a gerenciar este inventário.</p>
              </div>
            </div>
          </div>
        )}
        <InventoryTable targetUserId={activeUserId} />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest text-center md:text-left">
          <p>© {new Date().getFullYear()} S-28 Digital • Gestão inteligente</p>
          <div className="flex gap-8">
            <a href="https://wa.me/5535991210466?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20aplicativo%20S-28%20Digital." target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
