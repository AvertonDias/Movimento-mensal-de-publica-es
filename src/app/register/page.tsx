
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, UserPlus, Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { doc, getDoc } from "firebase/firestore";

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteOwner, setInviteOwner] = useState<string | null>(null);
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Verifica se há um convite ativo
  useEffect(() => {
    async function checkInvite() {
      if (token && db) {
        const inviteRef = doc(db, 'invites', token);
        const snap = await getDoc(inviteRef);
        if (snap.exists()) {
          setInviteOwner(snap.data().ownerName);
          localStorage.setItem('pending_invite_token', token);
        }
      }
    }
    checkInvite();
  }, [token, db]);

  // Após o cadastro, processa o convite
  useEffect(() => {
    if (user && !user.isAnonymous && db) {
      const pendingToken = localStorage.getItem('pending_invite_token');
      if (pendingToken) {
        const inviteRef = doc(db, 'invites', pendingToken);
        // Atualiza o convite com o ID do novo ajudante
        updateDocumentNonBlocking(inviteRef, {
          helperId: user.uid,
          label: user.displayName || user.email?.split('@')[0] || 'Ajudante'
        });
        // Também cria um atalho de acesso rápido para o ajudante (usando o token como ID do atalho)
        const myAccessRef = doc(db, 'invites', user.uid);
        updateDocumentNonBlocking(myAccessRef, {
          id: user.uid,
          ownerId: (inviteRef as any).ownerId || '', // Precisamos do ownerId original, o localStorage ou o snap inicial podem ajudar
          helperId: user.uid
        });
        localStorage.removeItem('pending_invite_token');
      }
      router.push('/');
    }
  }, [user, router, db]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    initiateEmailSignUp(auth, email, password);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-primary/10">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <div className="bg-primary p-3 rounded-xl shadow-inner">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-tight">
          {inviteOwner ? "Aceitar Convite" : "Criar Conta"}
        </CardTitle>
        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
          {inviteOwner ? `Cadastre-se para ajudar ${inviteOwner}` : "Junte-se ao Inventário Fácil"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inviteOwner && (
          <div className="mb-6 p-3 bg-primary/10 rounded-lg flex items-start gap-2 border border-primary/20">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase leading-tight text-primary">
              Você foi convidado por <strong>{inviteOwner}</strong>. Cadastre-se agora para ter acesso à página inicial e gerenciar as publicações.
            </p>
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" className="w-full font-bold uppercase tracking-wider">
            <UserPlus className="mr-2 h-4 w-4" /> Finalizar Cadastro
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider text-xs">
          Já tem uma conta? <Link href="/login" className="text-primary hover:underline">Entre agora</Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
