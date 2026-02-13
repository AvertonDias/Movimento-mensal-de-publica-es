'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Info, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { initiateEmailSignIn, initiateGoogleSignIn } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
  }, [token]);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      const pendingToken = localStorage.getItem('pending_invite_token');
      if (pendingToken) {
        router.push(`/register?token=${pendingToken}`);
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleAuthError = (error: any) => {
    if (error.code === 'auth/popup-closed-by-user') {
      setIsLoading(false);
      return;
    }

    console.error(error);
    let message = "Ocorreu um erro ao tentar entrar. Verifique suas credenciais.";
    
    if (error.code === 'auth/unauthorized-domain') {
      message = "Este domínio não está autorizado no Firebase. Adicione o domínio atual nas configurações de Authentication do seu projeto.";
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = "E-mail ou senha inválidos.";
    }

    toast({
      variant: "destructive",
      title: "Erro de Autenticação",
      description: message,
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-primary/10 overflow-hidden">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="rounded-xl overflow-hidden w-[72px] h-[72px] shadow-sm">
            <Image 
              src="/icon.png" 
              alt="Logo" 
              width={72} 
              height={72} 
              className="object-cover w-full h-full" 
              unoptimized 
            />
          </div>
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-tight">Entrar</CardTitle>
        <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
          {token ? "Entre para aceitar seu convite" : "S-28 DIGITAL: GESTÃO INTELIGENTE"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {token && (
          <div className="p-3 bg-primary/10 rounded-lg flex items-start gap-2 border border-primary/20">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase leading-tight text-primary">
              Você possui um convite de ajudante. Entre com sua conta para aceitá-lo.
            </p>
          </div>
        )}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1">Senha</Label>
              <Link 
                href="/forgot-password" 
                className="text-[10px] font-bold uppercase text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
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
          <Button type="submit" className="w-full font-bold uppercase tracking-wider h-11" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
            Entrar
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-muted-foreground">
            <span className="bg-card px-2">Ou continue com</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full font-bold uppercase tracking-wider gap-2 h-11 border-primary/20 hover:bg-primary/5" 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {!isLoading && (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Google"}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-muted/50 bg-neutral-50/50 py-4">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          Não tem uma conta? <Link href={`/register${token ? `?token=${token}` : ''}`} className="text-primary hover:underline ml-1">Cadastre-se</Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Iniciando...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
