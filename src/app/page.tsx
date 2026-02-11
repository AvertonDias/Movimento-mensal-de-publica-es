import { InventoryTable } from "@/components/inventory/InventoryTable";
import { BookOpen, ClipboardList, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(previousMonthDate);

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
              <p className="text-sm text-muted-foreground font-semibold uppercase tracking-[0.2em]">Publicações • JW Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/history">
              <Button variant="ghost" className="gap-2 font-bold uppercase text-xs tracking-wider">
                <History className="h-4 w-4" />
                Histórico
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
              <ClipboardList className="h-4 w-4 text-accent-foreground" />
              <span className="text-xs font-bold text-accent-foreground uppercase tracking-wider">Formulário S-28-T</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        <section className="bg-white p-8 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground font-headline">Controle de Estoque</h2>
            <p className="text-muted-foreground text-lg">Gerencie o fluxo de Bíblias, Livros e Brochuras com precisão.</p>
          </div>
          <div className="flex gap-4">
             <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Mês de Referência</p>
                <p className="text-xl font-black text-primary uppercase">{monthName}</p>
             </div>
          </div>
        </section>

        <InventoryTable />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-xs font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Gestão de Publicações Inteligente</p>
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
