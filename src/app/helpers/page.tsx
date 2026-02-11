
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ChevronLeft, Copy, Plus, Trash2, Users, ExternalLink, LinkIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function HelpersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

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
      label: 'Aguardando acesso...', // Nome padrão que será atualizado quando o ajudante entrar
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Link de acesso gerado!",
      description: "Copie o link abaixo e envie para o seu ajudante.",
    });
  };

  const copyToClipboard = (tokenId: string) => {
    const url = `${window.location.origin}/guest/${tokenId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link de acesso único está na sua área de transferência.",
    });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const inviteRef = doc(db, 'invites', id);
    deleteDocumentNonBlocking(inviteRef);
  };

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
              Novo Link de Acesso
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-wider">
              Gere um link para que outros vejam seu histórico S-28-T. O nome do ajudante será preenchido automaticamente ao acessar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateInvite} className="w-full bg-primary hover:bg-primary/90 font-bold uppercase text-xs py-6 shadow-md transition-all active:scale-95">
              <Plus className="h-5 w-5 mr-2" /> Gerar Novo Link de Acesso
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            Links Gerados ({myInvites.length})
          </h2>
          
          {myInvites.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-neutral-300">
              <Users className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
              <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Nenhum link ativo no momento</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myInvites.map((invite) => (
                <Card key={invite.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className={cn(
                        "font-black text-sm uppercase",
                        invite.label === 'Aguardando acesso...' ? "text-muted-foreground italic" : "text-foreground"
                      )}>
                        {invite.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                        Gerado em {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 h-9 text-[10px] font-black uppercase tracking-widest bg-white"
                        onClick={() => copyToClipboard(invite.id)}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar Link
                      </Button>
                      <Link href={`/guest/${invite.id}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10">
                          <ExternalLink className="h-4 w-4 text-primary" />
                        </Button>
                      </Link>
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

import { cn } from "@/lib/utils";
