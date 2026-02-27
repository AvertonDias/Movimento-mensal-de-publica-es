'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Copy, Plus, Trash2, Users, LinkIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HelpersPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !currentUser) return null;
    return doc(db, 'invites', currentUser.uid);
  }, [db, currentUser]);

  const { data: helperInvite, isLoading: isCheckingRole } = useDoc(helperInviteRef);

  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
    if (!isCheckingRole && helperInvite && helperInvite.ownerId !== currentUser?.uid) {
      // Se eu sou apenas ajudante de outro, não devo ver esta página de gestão
      router.push('/');
    }
  }, [currentUser, isUserLoading, router, helperInvite, isCheckingRole]);

  const invitesQuery = useMemoFirebase(() => {
    if (!db || !currentUser) return null;
    return collection(db, 'invites');
  }, [db, currentUser]);

  const { data: allInvites } = useCollection(invitesQuery);
  
  // Filtra apenas os convites que eu criei E que não são para mim mesmo (ajudantes externos)
  const myInvites = useMemo(() => {
    if (!allInvites || !currentUser) return [];

    const mine = allInvites.filter(inv => {
      const isMine = inv.ownerId === currentUser.uid;
      const isSelfInviteByTokenId = inv.id === currentUser.uid;
      const isSelfInviteByHelperId = inv.helperId === currentUser.uid;
      return isMine && !isSelfInviteByTokenId && !isSelfInviteByHelperId;
    });

    // DEDUPLICAÇÃO:
    // Quando um ajudante aceita, existem 2 docs: o do Token e o do UID do ajudante (para as rules).
    // Mostramos apenas o doc do TOKEN (onde id != helperId) pois ele tem o nome correto do ajudante no label.
    // Se o token foi deletado mas o acesso ficou (erro anterior), mostramos o doc de acesso.
    const map = new Map();
    mine.forEach(inv => {
      const key = inv.helperId || inv.id;
      const existing = map.get(key);
      // Prefere o documento que NÃO tem id igual ao helperId (o Token original)
      if (!existing || (inv.id !== inv.helperId)) {
        map.set(key, inv);
      }
    });

    return Array.from(map.values());
  }, [allInvites, currentUser]);

  const handleCreateInvite = () => {
    if (!currentUser || !db) return;

    const tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteRef = doc(db, 'invites', tokenId);

    setDocumentNonBlocking(inviteRef, {
      id: tokenId,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Dono',
      label: 'Aguardando cadastro...',
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Link de acesso gerado!",
      description: "Copie o convite abaixo e envie para o seu ajudante.",
    });
  };

  const copyToClipboard = (tokenId: string) => {
    const url = `${window.location.origin}/?token=${tokenId}`;
    const invitationMessage = `Olá! Estou convidando você para ajudar no gerenciamento do estoque de publicações da congregação através do aplicativo S-28 Digital. Acesse o link abaixo para aceitar o convite: ${url}`;
    navigator.clipboard.writeText(invitationMessage);
    toast({
      title: "Convite copiado!",
      description: "A mensagem completa foi copiada. Agora é só colar na conversa com o ajudante.",
    });
  };

  const confirmDelete = () => {
    if (!db || !deleteConfirmId || !allInvites) return;
    
    const inviteToDelete = allInvites.find(inv => inv.id === deleteConfirmId);
    if (!inviteToDelete) return;

    // 1. Deleta o registro clicado
    deleteDocumentNonBlocking(doc(db, 'invites', inviteToDelete.id));

    // 2. REVOGAÇÃO REAL: Se houver um ajudante conectado, deleta o documento de ACESSO (ID = helperId)
    // Este é o documento que as Firestore Rules consultam para dar acesso.
    if (inviteToDelete.helperId) {
      deleteDocumentNonBlocking(doc(db, 'invites', inviteToDelete.helperId));
      
      // Procura outros docs que possam estar sobrando com este helperId
      const others = allInvites.filter(i => i.helperId === inviteToDelete.helperId && i.id !== inviteToDelete.id && i.ownerId === currentUser?.uid);
      others.forEach(o => deleteDocumentNonBlocking(doc(db, 'invites', o.id)));
    }

    setDeleteConfirmId(null);
    toast({
      variant: "destructive",
      title: "Ajudante removido",
      description: "O acesso foi totalmente revogado.",
    });
  };

  if (isUserLoading || isCheckingRole || !currentUser) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-6 px-6 font-body">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight font-headline">Gerenciar Ajudantes</h1>
          </div>
        </div>

        <Card className="border-primary/20 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="uppercase text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Novo Convite
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-left text-muted-foreground">
              Gere um link para que outra pessoa ajude a gerenciar o SEU inventário.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button 
              onClick={handleCreateInvite} 
              className="w-full bg-primary hover:bg-primary/90 font-bold uppercase text-xs py-6 shadow-md transition-all active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" /> Gerar Novo Link de Convite
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
            Pessoas que ajudam você ({myInvites.length})
          </h2>
          
          {myInvites.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-neutral-300">
              <Users className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
              <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest text-center px-4">
                Ninguém está ajudando você no momento. <br/> Use o botão acima para convidar um irmão.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myInvites.map((invite) => {
                const isPending = invite.label === 'Aguardando cadastro...';
                // Se o doc de acesso ficou órfão (sem o token), o label pode ser o do dono. Ajustamos visualmente.
                const displayName = (invite.id === invite.helperId && invite.label === invite.ownerName) 
                  ? "Ajudante Conectado" 
                  : (invite.helperName || invite.label);
                
                return (
                  <Card key={invite.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className={cn(
                          "font-black text-sm uppercase flex items-center gap-2 justify-center sm:justify-start",
                          isPending ? "text-muted-foreground italic" : "text-foreground"
                        )}>
                          {displayName}
                          {!isPending && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                          {isPending ? "Link enviado em" : "Ajudando desde"} {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 h-9 text-[10px] font-black uppercase tracking-widest bg-white"
                            onClick={() => copyToClipboard(invite.id)}
                          >
                            <Copy className="h-3.5 w-3.5" /> Copiar Link
                          </Button>
                        ) : (
                          <div className="bg-accent/10 text-accent-foreground text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-accent/20 h-9 flex items-center">
                            Conectado
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => setDeleteConfirmId(invite.id)}
                          title="Remover Ajudante"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 uppercase font-black text-destructive text-left">
              <AlertTriangle className="h-5 w-5" />
              Remover Ajudante?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold uppercase text-xs leading-relaxed text-left">
              Deseja realmente revogar o acesso deste ajudante? Ele não poderá mais visualizar ou editar o seu inventário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black uppercase text-[10px] tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest"
            >
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
