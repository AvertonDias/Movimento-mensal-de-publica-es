import { InventoryTable } from "@/components/inventory/InventoryTable";
import { BookOpen, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen pb-12 bg-background/50">
      <header className="bg-white border-b border-border py-6 px-6 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-xl shadow-inner">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground uppercase font-headline">Movimento Mensal</h1>
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-[0.2em]">Publicações • JW</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/history">
              <Button variant="ghost" className="gap-2 font-bold uppercase text-xs tracking-wider border hover:bg-neutral-50">
                <History className="h-4 w-4" />
                S-28-T Histórico
              </Button>
            </Link>
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
            <a href="#" className="hover:text-primary transition-colors">Relatórios</a>
            <a href="#" className="hover:text-primary transition-colors">Instruções</a>
            <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
