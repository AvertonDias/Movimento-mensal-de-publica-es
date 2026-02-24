'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User as UserIcon, Save, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user) {
      setName(user.displayName || '');
    }
  }, [user, isUserLoading, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser || !name.trim()) return;

    setIsUpdating(true);
    try {
      // 1. Atualiza no Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: name
      });

      // 2. Atualiza no Firestore (Cadastro de Usuário)
      const userRef = doc(db, 'users', user.uid);
      updateDocumentNonBlocking(userRef, {
        name: name
      });

      toast({
        title: "Perfil atualizado!",
        description: "Seu nome foi alterado com sucesso.",
      });
      
      // Pequeno delay para o usuário ver o feedback antes de voltar
      setTimeout(() => router.push('/'), 1500);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Verifique sua conexão.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carregando Perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 font-body">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-3 w-3" /> Voltar ao Início
        </Link>

        <Card className="shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center space-y-2 bg-primary/5 pb-8 border-b border-primary/10">
            <div className="flex justify-center mb-2 pt-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/10 relative">
                <UserIcon className="h-12 w-12 text-primary" />
                <div className="absolute -bottom-1 -right-1 bg-accent p-1 rounded-full border-2 border-white shadow-sm">
                  <CheckCircle2 className="h-3 w-3 text-accent-foreground" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Meu Perfil</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Configurações de Identidade
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">E-mail da Conta (Fixado)</Label>
                <Input 
                  value={user.email || ''} 
                  disabled 
                  className="bg-neutral-50 border-neutral-200 font-bold text-muted-foreground cursor-not-allowed h-11"
                />
              </div>
              
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest ml-1">Nome Completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Seu Nome" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="font-bold uppercase h-11 focus:ring-primary border-neutral-300"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isUpdating || !name.trim()} 
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-lg gap-2 mt-2 transition-all active:scale-95"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isUpdating ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </div>
          </CardContent>
          
          <CardFooter className="bg-neutral-50/50 border-t border-neutral-100 flex justify-center py-4">
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center leading-tight">
              Este nome será exibido nos relatórios <br /> e para os ajudantes vinculados ao seu acesso.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}