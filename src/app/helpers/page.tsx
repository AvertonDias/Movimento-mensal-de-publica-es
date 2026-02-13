'use client';

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ChevronLeft, Copy, Plus, Trash2, Users, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

export default function HelpersPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite, isLoading: isCheckingRole } = useDoc(helperInviteRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    // Se o usuário já for um ajudante de alguém, ele não deve gerenciar outros ajudantes
    if (!isCheckingRole && helperInvite) {
      router.push('/');
    }
  }, [user, isUserLoading, router, helperInvite, isCheckingRole]);

  const invitesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'invites');
  }, [db, user]);

  const { data: allInvites } = useCollection(invitesQuery);
  const myInvites = allInvites?.filter(inv => inv.ownerId === user?.uid) || [];

  const handleCreateInvite = () => {
    if (!user || !db) return;

    const tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteRef = doc(db, 'invites', tokenId);

    setDocumentNonBlocking(inviteRef, {
      id: tokenId,
      ownerId: user.uid,
      ownerName: user.displayName || user.email?.split('@')[0] || 'Dono',
      label: 'Aguardando cadastro...',
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Link de acesso gerado!",
      description: "Copie o convite abaixo e envie para o seu ajudante.",
    });
  };

  const copyToClipboard = (tokenId: string) => {
    const url = `${window.location.origin}/register?token=${tokenId}`;
    
    // Mensagem formatada exatamente como solicitado, sem erros de digitação
    const invitationMessage = `Olá! Estou convidando você para ajudar no gerenciamento do estoque de publicações da congregação através do aplicativo S-28 Digital. Acesse o link abaixo para aceitar o convite e realizar o seu cadastro: ${url}`;
    
    navigator.clipboard.writeText(invitationMessage);
    
    toast({
      title: "Convite copiado!",
      description: "A mensagem completa foi copiada. Agora é só colar na conversa com o ajudante.",
    });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const inviteRef = doc(db, 'invites', id);
    deleteDocumentNonBlocking(inviteRef);
  };

  if (isUserLoading || isCheckingRole || !user || helperInvite) return null;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 font-body">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black uppercase tracking-tight font-headline">Ajudantes</h1>
          </div>
        </div>

        <Card className="border-primary/20 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="uppercase text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Novo Link de Convite
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Gere uma mensagem de convite para que outra pessoa ajude a gerenciar seu inventário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateInvite} 
              className="w-full bg-primary hover:bg-primary/90 font-bold uppercase text-xs py-6 shadow-md transition-all active:scale-95"
            >
              <Plus className="h-5 w-5 mr-2" /> Gerar Novo Link de Convite
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            Convites Ativos ({myInvites.length})
          </h2>
          
          {myInvites.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-neutral-300">
              <Users className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
              <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Nenhum convite gerado</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myInvites.map((invite) => (
                <Card key={invite.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className={cn(
                        "font-black text-sm uppercase",
                        invite.label === 'Aguardando cadastro...' ? "text-muted-foreground italic" : "text-foreground"
                      )}>
                        {invite.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                        Criado em {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 h-9 text-[10px] font-black uppercase tracking-widest bg-white"
                        onClick={() => copyToClipboard(invite.id)}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar Convite
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(invite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
