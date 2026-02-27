'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ShieldCheck, Loader2, UserPlus, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import Image from "next/image";
import { doc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function HomeContent() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<'personal' | 'shared'>('personal');
  const [sharedOwnerId, setSharedOwnerId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verifica se há um token na URL ou no localStorage
    const urlToken = searchParams.get('token');
    const localToken = localStorage.getItem('pending_invite_token');
    const token = urlToken || localToken;
    
    if (token) {
      setPendingToken(token);
      if (urlToken) localStorage.setItem('pending_invite_token', urlToken);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      const token = searchParams.get('token');
      router.replace('/login' + (token ? `?token=${token}` : ''));
    }
  }, [user, isUserLoading, router, mounted, searchParams]);

  // Busca detalhes do convite se houver um pendente
  const inviteRef = useMemoFirebase(() => {
    if (!db || !pendingToken || !user || user.isAnonymous) return null;
    return doc(db, 'invites', pendingToken);
  }, [db, pendingToken, user]);

  const { data: invite } = useDoc(inviteRef);

  // Verificação de ajudante atual
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

  const handleAcceptInvite = async () => {
    if (!db || !user || !pendingToken || !invite) return;
    setIsProcessingInvite(true);
    
    try {
      // 1. Atualiza o convite original com o ID do ajudante
      updateDocumentNonBlocking(inviteRef, {
        helperId: user.uid,
        label: user.displayName || user.email?.split('@')[0] || 'Ajudante'
      });
      
      // 2. Cria o registro de acesso do ajudante (usando o UID do ajudante como ID do doc)
      const myAccessRef = doc(db, 'invites', user.uid);
      setDocumentNonBlocking(myAccessRef, {
        id: user.uid,
        ownerId: invite.ownerId,
        helperId: user.uid,
        ownerName: invite.ownerName,
        label: invite.ownerName,
        createdAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Convite Aceito!",
        description: `Agora você está ajudando ${invite.ownerName} com o inventário.`,
      });
      
      localStorage.removeItem('pending_invite_token');
      setPendingToken(null);
      
      // Limpa a URL e atualiza o estado
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.toString());
      
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao aceitar convite" });
    } finally {
      setIsProcessingInvite(false);
    }
  };

  const handleDismissInvite = () => {
    localStorage.removeItem('pending_invite_token');
    setPendingToken(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('token');
    window.history.replaceState({}, '', newUrl.toString());
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
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
          <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest opacity-60">
            Preparando ambiente...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeUserId = (viewMode === 'shared' && sharedOwnerId) ? sharedOwnerId : user.uid;
  const showInviteAcceptance = invite && invite.ownerId !== user.uid && !isHelper;

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 space-y-8">
        
        {/* Banner de Aceitação de Convite */}
        {showInviteAcceptance && (
          <Card className="bg-primary/10 border-primary/20 p-4 sm:p-6 animate-in fade-in slide-in-from-top-4 overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="bg-primary p-3 rounded-2xl shadow-lg shrink-0">
                <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">Convite de Ajudante</h3>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase leading-tight">
                  <strong>{invite.ownerName}</strong> convidou você para colaborar no inventário dele.
                </p>
                <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <p className="text-[8px] sm:text-[9px] font-black text-destructive uppercase tracking-widest">
                    Aviso: seu estoque pessoal será substituído pelo de {invite.ownerName}.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDismissInvite} 
                  disabled={isProcessingInvite}
                  className="flex-1 sm:flex-none uppercase font-black text-[9px] sm:text-[10px] tracking-widest hover:bg-white/50 h-10 px-4"
                >
                  <X className="h-3 w-3 mr-1" /> Recusar
                </Button>
                <Button 
                  onClick={handleAcceptInvite} 
                  disabled={isProcessingInvite}
                  size="sm"
                  className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 font-black uppercase text-[9px] sm:text-[10px] tracking-widest shadow-md gap-2 h-10 px-6"
                >
                  {isProcessingInvite ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Aceitar Convite
                </Button>
              </div>
            </div>
          </Card>
        )}

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
        <div className="w-full">
          <InventoryTable targetUserId={activeUserId} />
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
