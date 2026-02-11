
'use client';

import { InventoryTable } from "@/components/inventory/InventoryTable";
import { BookOpen, History, LogOut, User as UserIcon, LogIn, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body">
      <header className="bg-white border-b border-border py-4 px-6 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2.5 rounded-xl shadow-inner">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase font-headline">Movimento Mensal</h1>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">Publicações • JW</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/helpers">
                <Button variant="ghost" className="gap-2 font-bold uppercase text-[10px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9">
                  <Users className="h-4 w-4" />
                  Ajudantes
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" className="gap-2 font-bold uppercase text-[10px] tracking-widest border hover:bg-neutral-50 h-9">
                  <History className="h-4 w-4" />
                  S-28-T Histórico
                </Button>
              </Link>
            </div>

            {!isUserLoading && user && !user.isAnonymous ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/helpers">
                    <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest">
                      <Users className="mr-2 h-4 w-4" /> Ajudantes
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/history">
                    <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest">
                      <History className="mr-2 h-4 w-4" /> Histórico S-28-T
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive font-bold uppercase text-[10px] tracking-widest">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="font-bold uppercase text-xs tracking-wider h-9">
                  <LogIn className="mr-2 h-4 w-4" /> Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        <InventoryTable />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Gestão de Publicações • Formulário S-28-T (8/24)</p>
          <div className="flex gap-8">
            <Link href="/helpers" className="hover:text-primary transition-colors">Ajudantes</Link>
            <a href="#" className="hover:text-primary transition-colors">Instruções</a>
            <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
