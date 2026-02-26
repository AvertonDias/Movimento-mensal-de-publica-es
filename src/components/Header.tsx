'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LogOut, User as UserIcon, Menu, UserCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ProfileModal } from "@/components/ProfileModal";

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlHeader, { passive: true });
    return () => window.removeEventListener('scroll', controlHeader);
  }, [mounted]);

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  const handleCheckForUpdates = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          toast({
            title: "Procurando atualizações...",
            description: "Verificando se há uma nova versão disponível.",
          });
          
          await registration.update();
          
          setTimeout(() => {
            toast({
              title: "Sistema Verificado",
              description: "Se houver uma nova versão, o aplicativo será reiniciado automaticamente.",
            });
          }, 2000);
        }
      } catch (err) {
        console.error("Erro ao procurar atualizações:", err);
      }
    }
  };

  if (!mounted || isUserLoading || !user || user.isAnonymous) return null;

  return (
    <>
      <header 
        className={cn(
          "bg-white/80 backdrop-blur-md border-b border-border py-3 px-4 sm:px-6 fixed top-0 left-0 right-0 z-20 shadow-sm transition-transform duration-300 ease-in-out print:hidden",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-primary/5 text-primary border border-primary/10 shrink-0">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
              <div className="rounded-xl overflow-hidden w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] border border-primary/10 shrink-0">
                <Image src="/icon.png" alt="Logo" width={38} height={38} className="object-cover w-full h-full" unoptimized priority />
              </div>
              <div className="flex flex-col justify-center text-left shrink-0">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-foreground uppercase font-headline leading-none">
                  S-28 Digital
                </h1>
                <p className="hidden sm:block text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 leading-none">
                  Gestão inteligente
                </p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full shrink-0 ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
                  <Avatar className="h-9 w-9 border border-primary/20">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 text-left">
                    <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onSelect={() => setIsProfileModalOpen(true)} 
                  className="font-bold uppercase text-[10px] tracking-widest cursor-pointer text-foreground focus:text-primary"
                >
                  <UserCircle className="mr-2 h-4 w-4" /> Editar Perfil
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onSelect={handleCheckForUpdates} 
                  className="font-bold uppercase text-[10px] tracking-widest cursor-pointer text-foreground focus:text-primary"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Procurar Atualizações
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
}