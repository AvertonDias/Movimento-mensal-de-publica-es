
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Componente de carregamento unificado para evitar erros de hidratação
function HomeLoading() {
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
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('pending_invite_token') : null;
    const token = urlToken || localToken;
    
    if (token) {
      setPendingToken(token);
      if (urlToken && typeof window !== 'undefined') {
        localStorage.setItem('pending_invite_token', urlToken);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      const urlToken = searchParams.get('token');
      const localToken = localStorage.getItem('pending_invite_token');
      const token = urlToken || localToken;
      router.replace('/login' + (token ? `?token=${token}` : ''));
    }
  }, [user, isUserLoading, router, mounted, searchParams]);

  // Busca detalhes do convite se houver um pendente
  const inviteRef = useMemoFirebase(() => {
    if (!db || !pendingToken || !user || user.isAnonymous) return null;
    return doc(db, 'invites', pendingToken);
  }, [db, pendingToken, user]);

  const { data: invite, isLoading: isInviteLoading } = useDoc(inviteRef);

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
      const helperName = user.displayName || user.email?.split('@')[0] || 'Ajudante';

      // 1. Atualiza o convite original com o ID do ajudante
      updateDocumentNonBlocking(inviteRef, {
        helperId: user.uid,
        label: helperName
      });
      
      // 2. Cria o registro de acesso do ajudante (usando o UID do ajudante como ID do doc)
      // Este documento é o que as regras de segurança consultam.
      const myAccessRef = doc(db, 'invites', user.uid);
      setDocumentNonBlocking(myAccessRef, {
        id: user.uid,
        ownerId: invite.ownerId,
        helperId: user.uid,
        ownerName: invite.ownerName,
        helperName: helperName, // Salva o nome para o proprietário ver na lista de gestão
        label: invite.ownerName, // Label para o ajudante ver quem ele está ajudando
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
    return <HomeLoading />;
  }

  if (!user) return null;

  // Verificações de validade do convite
  const isInviteExpired = (invite && invite.helperId && invite.helperId !== user.uid) || 
                          (!isInviteLoading && pendingToken && !invite);
  
  // O modal aparece se houver um convite que não seja o atual do usuário
  const showInviteModal = !!pendingToken && !isInviteLoading && (
    (invite && invite.ownerId !== user.uid && (!isHelper || helperInvite?.ownerId !== invite.ownerId)) ||
    isInviteExpired
  );

  const activeUserId = (viewMode === 'shared' && sharedOwnerId) ? sharedOwnerId : user.uid;

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body overflow-x-hidden w-full">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 space-y-8 w-full overflow-x-hidden">
        
        {/* Modal de Aceitação de Convite - Persistente até ação do usuário */}
        <Dialog open={!!showInviteModal} onOpenChange={(open) => !open && !isProcessingInvite && handleDismissInvite()}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            {isInviteExpired ? (
              <>
                <DialogHeader className="p-6 bg-destructive/10 border-b border-destructive/20 text-left">
                  <div className="flex items-center gap-4">
                    <div className="bg-destructive p-3 rounded-2xl shadow-lg shrink-0">
                      <X className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black uppercase tracking-tight">Convite Expirado</DialogTitle>
                      <DialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-tight">
                        Este link não é mais válido
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="p-6 space-y-4">
                  <p className="text-sm font-bold text-foreground leading-relaxed uppercase">
                    Este convite já foi utilizado por outra pessoa ou foi removido pelo coordenador.
                  </p>
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wide leading-tight">
                      Para continuar ajudando na gestão, solicite ao coordenador de publicações que gere um novo link de convite na página de ajudantes.
                    </p>
                  </div>
                </div>
                <DialogFooter className="p-6 bg-neutral-50/50 border-t border-neutral-100">
                  <Button 
                    onClick={handleDismissInvite}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-[10px] tracking-widest h-12"
                  >
                    Entendi
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader className="p-6 bg-primary/10 border-b border-primary/20 text-left">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary p-3 rounded-2xl shadow-lg shrink-0">
                      <UserPlus className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black uppercase tracking-tight">Convite de Ajudante</DialogTitle>
                      <DialogDescription className="text-xs font-bold uppercase text-muted-foreground leading-tight">
                        Solicitação de colaboração pendente
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-foreground leading-relaxed uppercase">
                      <strong className="text-primary">{invite?.ownerName}</strong> convidou você para gerenciar o estoque de publicações em conjunto.
                    </p>
                    <div className="bg-destructive/5 border border-destructive/10 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-[10px] font-black text-destructive uppercase tracking-wide leading-tight">
                        Ao aceitar, seu inventário pessoal será pausado e você passará a visualizar e editar apenas os dados de {invite?.ownerName}.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={handleDismissInvite} 
                    disabled={isProcessingInvite}
                    className="w-full sm:flex-1 uppercase font-black text-[10px] tracking-widest h-12"
                  >
                    <X className="h-4 w-4 mr-2" /> Recusar
                  </Button>
                  <Button 
                    onClick={handleAcceptInvite} 
                    disabled={isProcessingInvite}
                    className="w-full sm:flex-1 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-lg gap-2 h-12"
                  >
                    {isProcessingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aceitar Convite
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {isHelper && (
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 w-full">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent-foreground shrink-0" />
              <div>
                <p className="text-xs font-black uppercase text-accent-foreground">Acesso Autorizado</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Você está ajudando a gerenciar o inventário de {helperInvite.ownerName}.</p>
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

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
