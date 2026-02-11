import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Package, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen pb-12">
      <header className="bg-white border-b border-border py-4 px-6 mb-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-headline">Inventário Fácil</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Gestão Inteligente & JW Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Dados Seguros</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-foreground font-headline">Painel de Controle</h2>
          <p className="text-muted-foreground">Gerencie seus itens de forma flexível e utilize a IA para otimizar seu estoque.</p>
        </section>

        <InventoryTable />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Inventário Fácil. Desenvolvido para máxima organização.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Ajuda</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
