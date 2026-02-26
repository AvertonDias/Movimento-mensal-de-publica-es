'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.displayName || '');
    }
  }, [user, isOpen]);

  // Efeito de segurança para destravar a tela após fechar o modal
  useEffect(() => {
    if (!isOpen) {
      const forceUnlock = () => {
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
        }
      };
      
      forceUnlock();
      const timer = setTimeout(forceUnlock, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser || !name.trim()) return;

    setIsUpdating(true);
    try {
      // 1. Atualiza no Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: name
      });

      // 2. Atualiza no Firestore
      const userRef = doc(db, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        name: name,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Perfil atualizado!",
        description: "Seu nome foi alterado com sucesso.",
      });
      
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ""} />
                <AvatarFallback className="bg-white text-primary text-2xl font-black">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || <UserIcon className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-accent p-1.5 rounded-full border-2 border-white shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-center">Meu Perfil</DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
            Configurações de Identidade
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground">E-mail da Conta</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-neutral-50 border-neutral-200 font-bold text-muted-foreground cursor-not-allowed h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-[10px] font-black uppercase tracking-widest ml-1">Nome Completo</Label>
              <Input 
                id="modal-name" 
                placeholder="Seu Nome" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="font-bold uppercase h-11 focus:ring-primary border-neutral-300"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              type="submit" 
              disabled={isUpdating || !name.trim()} 
              className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-lg gap-2"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isUpdating ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} className="font-bold uppercase text-[10px] tracking-widest">
              Cancelar
            </Button>
          </div>
        </form>
        
        <div className="bg-neutral-50 p-4 border-t border-neutral-100">
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center leading-tight">
            Este nome será exibido nos relatórios <br /> e para os seus ajudantes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
