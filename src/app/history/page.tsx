'use client';

import { use } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { ChevronLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Página de Histórico (Formulário S-28-T 8/24)
 * Esta página é um espelho exato do formulário oficial de papel.
 * O botão de imprimir utiliza a função nativa do navegador, que permite "Salvar como PDF".
 */
export default function HistoryPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Unwrap dynamic values for Next.js 15 using use()
  use(props.params);
  use(props.searchParams);

  return (
    <div className="min-h-screen bg-neutral-200 py-6 px-4 print:p-0 print:bg-white overflow-x-auto font-body">
      <div className="max-w-[1300px] mx-auto space-y-4 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Inventário
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="gap-2 bg-white" 
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir S-28-T (8/24)
          </Button>
        </div>

        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 min-w-[1250px] print:min-w-0">
          {/* Top Header */}
          <div className="flex justify-between items-baseline border-b-2 border-black pb-1 mb-2">
            <h1 className="text-xl font-black tracking-tight uppercase font-headline">
              MOVIMENTO MENSAL DE PUBLICAÇÕES
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase">IDIOMA:</span>
              <div className="border-b border-black w-48 h-5 flex items-end px-2 font-bold text-xs">Português</div>
            </div>
          </div>

          {/* Instruções Compactas */}
          <div className="text-[9px] leading-[1.1] space-y-0.5 mb-2 text-justify print:mb-1">
            <p><span className="font-bold">INSTRUÇÕES:</span> 1. Todas as congregações coordenadoras de idioma devem fazer a contagem real das publicações todo mês. 2. Antes de fazer a contagem, recapitule a <span className="italic">Lista de Publicações a Serem Descartadas (S-60)</span>. 3. Se a sua congregação não puder enviar o relatório pelo JW Hub, preencha: <span className="font-bold">(1) Estoque</span> (fim do mês), <span className="font-bold">(2) Recebido</span> (durante o mês), <span className="font-bold">(3) Saída</span> (determinado pela soma do anterior + recebido - atual).</p>
          </div>

          <HistoryTable />

          <div className="mt-4 flex justify-between items-end border-t border-neutral-200 pt-2 print:mt-2">
            <span className="text-[8px] font-bold text-neutral-500 italic uppercase">S-28-T 8/24</span>
          </div>
        </div>
      </div>
    </div>
  );
}
