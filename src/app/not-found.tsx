import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-body">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black uppercase tracking-tighter text-primary">404</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Página não encontrada
          </p>
          <p className="text-xs text-muted-foreground font-medium px-4">
            O link que você acessou pode estar quebrado ou a página foi removida.
          </p>
        </div>
        <Button asChild className="w-full font-bold uppercase tracking-widest h-12 shadow-lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
