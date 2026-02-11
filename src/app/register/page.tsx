
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, UserPlus, Info } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser, useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { initiateEmailSignUp, initiateGoogleSignIn } from "@/firebase/non-blocking-login";
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

  useEffect(() => {
    if (user && !user.isAnonymous && db) {
      const pendingToken = localStorage.getItem('pending_invite_token');
      if (pendingToken) {
        const inviteRef = doc(db, 'invites', pendingToken);
        
        getDoc(inviteRef).then(snap => {
          if (snap.exists()) {
            const inviteData = snap.data();
            
            updateDocumentNonBlocking(inviteRef, {
              helperId: user.uid,
              label: user.displayName || user.email?.split('@')[0] || 'Ajudante'
            });
            
            const myAccessRef = doc(db, 'invites', user.uid);
            setDocumentNonBlocking(myAccessRef, {
              id: user.uid,
              ownerId: inviteData.ownerId,
              helperId: user.uid,
              ownerName: inviteData.ownerName,
              label: inviteData.ownerName,
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
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

  const handleGoogleRegister = () => {
    initiateGoogleSignIn(auth);
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
          {inviteOwner ? `Cadastre-se para ajudar ${inviteOwner}` : "MOVIMENTO MENSAL DE PUBLICAÇÕES"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inviteOwner && (
          <div className="mb-6 p-3 bg-primary/10 rounded-lg flex items-start gap-2 border border-primary/20">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase leading-tight text-primary">
              Você foi convidado por <strong>{inviteOwner}</strong>. Cadastre-se para acessar o inventário compartilhado.
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold text-muted-foreground">
            <span className="bg-card px-2">Ou use sua conta</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full font-bold uppercase tracking-wider gap-2 h-11" 
          onClick={handleGoogleRegister}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Cadastrar com Google
        </Button>
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
