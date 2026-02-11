import { HistoryTable } from "@/components/inventory/HistoryTable";
import { ChevronLeft, Printer, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir S-28-T
            </Button>
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-sm border border-neutral-300 overflow-hidden print:shadow-none print:border-none">
          {/* Cabeçalho que imita o formulário de papel */}
          <div className="p-8 border-b-2 border-black flex justify-between items-start bg-neutral-50/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-neutral-800" />
                <h1 className="text-2xl font-black tracking-tight text-black font-headline uppercase leading-none">
                  S-28-T
                </h1>
              </div>
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-none">
                Movimento Mensal de Publicações
              </p>
            </div>
            
            <div className="text-right space-y-4">
              <div className="border-b border-black pb-1">
                <span className="text-[9px] font-bold uppercase block">Congregação / Grupo</span>
                <span className="text-sm font-bold uppercase">Congregação Local</span>
              </div>
              <div className="flex gap-8">
                <div className="border-b border-black pb-1">
                  <span className="text-[9px] font-bold uppercase block">Mês</span>
                  <span className="text-sm font-bold uppercase">Fevereiro</span>
                </div>
                <div className="border-b border-black pb-1">
                  <span className="text-[9px] font-bold uppercase block">Ano</span>
                  <span className="text-sm font-bold uppercase">2024</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            <HistoryTable />
          </div>

          <div className="p-8 grid grid-cols-2 gap-12 mt-4 border-t border-neutral-200">
             <div className="space-y-8">
                <div className="border-b border-black pt-8">
                   <p className="text-[9px] font-bold uppercase">Assinatura do Servo de Publicações</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="bg-neutral-50 p-4 border border-neutral-200 rounded">
                   <p className="text-[10px] font-bold uppercase mb-2">Instruções:</p>
                   <ul className="text-[9px] text-neutral-600 space-y-1 leading-tight list-disc pl-4">
                      <li>Este formulário deve ser preenchido mensalmente.</li>
                      <li>As quantidades devem ser conferidas fisicamente no final do mês.</li>
                      <li>A coluna "Saída" é o resultado de (Anterior + Recebido) - Estoque Atual.</li>
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
