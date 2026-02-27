'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Info, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { initiateEmailSignUp, initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteOwner, setInviteOwner] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
  }, [token]);

  // Se o usuário já estiver logado e houver um token, redireciona para a Home
  // onde o banner de aceitação agora reside.
  useEffect(() => {
    if (user && !user.isAnonymous && !isUserLoading) {
      const pendingToken = localStorage.getItem('pending_invite_token');
      router.push(pendingToken ? `/?token=${pendingToken}` : '/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    async function checkInvite() {
      if (token && db) {
        const inviteRef = doc(db, 'invites', token);
        const snap = await getDoc(inviteRef);
        if (snap.exists()) {
          setInviteOwner(snap.data().ownerName);
        }
      }
    }
    checkInvite();
  }, [token, db]);

  const handleAuthError = (error: any) => {
    if (error.code === 'auth/popup-closed-by-user') {
      setIsProcessing(false);
      return;
    }
    console.error(error);
    toast({
      variant: "destructive",
      title: "Erro no Cadastro",
      description: error.message || "Ocorreu um erro ao processar sua conta.",
    });
  };

  const initializeUserDoc = (uid: string, userEmail: string | null, userName: string) => {
    if (!db) return;
    const userRef = doc(db, 'users', uid);
    setDocumentNonBlocking(userRef, {
      id: uid,
      email: userEmail,
      name: userName,
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", description: "As senhas não coincidem!" });
      return;
    }
    setIsProcessing(true);
    try {
      const userCredential = await initiateEmailSignUp(auth, email, password, name);
      initializeUserDoc(userCredential.user.uid, userCredential.user.email, name);
      // O useEffect acima cuidará do redirecionamento para a Home
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsProcessing(true);
    try {
      const userCredential = await initiateGoogleSignIn(auth);
      initializeUserDoc(
        userCredential.user.uid, 
        userCredential.user.email, 
        userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Usuário'
      );
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-primary/10">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <div className="rounded-xl overflow-hidden w-[64px] h-[64px]">
            <Image src="/icon.png" alt="Logo" width={64} height={64} className="object-cover w-full h-full" unoptimized />
          </div>
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-tight">
          {inviteOwner ? "Aceitar Convite" : "Criar Conta"}
        </CardTitle>
        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
          {inviteOwner ? `Cadastre-se para ajudar ${inviteOwner}` : "S-28 DIGITAL: GESTÃO INTELIGENTE"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {inviteOwner && (
          <div className="p-3 bg-primary/10 rounded-lg flex items-start gap-2 border border-primary/20">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase leading-tight text-primary">
              Você foi convidado por <strong>{inviteOwner}</strong>. Após o cadastro, você poderá aceitar o convite na tela inicial.
            </p>
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Seu Nome" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full font-bold uppercase tracking-wider"
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isProcessing ? "Finalizando..." : "Finalizar Cadastro"}
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
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Google
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center flex-col gap-2">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          Já tem uma conta? <Link href="/login" className="text-primary hover:underline">Entre agora</Link>
        </p>
      </CardFooter>
    </Card>
  );
}

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Iniciando ambiente...</p>
  </div>
);

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
