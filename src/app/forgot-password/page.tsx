'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Send, ChevronLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/firebase";
import { initiatePasswordReset } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    initiatePasswordReset(auth, email);
    setSubmitted(true);
    toast({
      title: "E-mail enviado!",
      description: "Verifique sua caixa de entrada para redefinir sua senha.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-primary p-3 rounded-xl shadow-inner">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Recuperar Senha</CardTitle>
          <CardDescription className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">
            MOVIMENTO MENSAL DE PUBLICAÇÕES
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail da conta</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full font-bold uppercase tracking-wider">
                <Send className="mr-2 h-4 w-4" /> Enviar Link de Recuperação
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-accent" />
              </div>
              <p className="text-sm font-bold uppercase leading-relaxed text-muted-foreground">
                Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha em instantes.
              </p>
              <Button asChild className="w-full font-bold uppercase tracking-wider">
                <Link href="/login">Voltar para Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-[10px] font-bold uppercase text-muted-foreground hover:text-primary flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" /> Voltar ao Início
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
