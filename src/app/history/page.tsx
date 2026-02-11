'use client';

import { use } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { ChevronLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Página de Histórico (Formulário S-28-T 8/24)
 * Esta página é um espelho exato do formulário oficial de papel.
 */
export default function HistoryPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  // Unwrap dynamic values for Next.js 15 using use()
  use(props.params);
  use(props.searchParams);

  return (
    <div className="min-h-screen bg-neutral-200 py-12 px-4 print:p-0 print:bg-white overflow-x-auto font-body">
      <div className="max-w-[1300px] mx-auto space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Inventário
            </Button>
          </Link>
          <Button variant="outline" className="gap-2 bg-white" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir S-28-T (8/24)
          </Button>
        </div>

        <div className="bg-white shadow-2xl p-10 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-0 min-w-[1250px]">
          {/* Top Header */}
          <div className="flex justify-between items-baseline border-b-2 border-black pb-2 mb-4">
            <h1 className="text-2xl font-black tracking-tight uppercase font-headline">
              MOVIMENTO MENSAL DE PUBLICAÇÕES
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold uppercase">IDIOMA:</span>
              <div className="border-b-2 border-black w-64 h-6 flex items-end px-2 font-bold text-sm">Português</div>
            </div>
          </div>

          {/* Instruções */}
          <div className="text-[11px] leading-[1.3] space-y-1 mb-6 text-justify">
            <p><span className="font-bold">INSTRUÇÕES:</span></p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Todas as congregações coordenadoras de idioma devem fazer a contagem real das publicações todo mês. Se a sua congregação envia todo mês um relatório do inventário de publicações pelo JW Hub, você não precisa usar este formulário.</li>
              <li>Antes de fazer a contagem, recapitule a <span className="italic">Lista de Publicações a Serem Descartadas (S-60)</span> e siga as instruções sobre jogar fora os itens que aparecem na lista.</li>
              <li>Se a sua congregação não puder enviar todo mês um relatório do inventário de publicações pelo JW Hub, certifique-se de que as informações a seguir sejam preenchidas abaixo para cada mês:
                <ul className="list-none pl-4 pt-1 space-y-1">
                  <li><span className="font-bold">(1) Estoque:</span> Anote a quantidade em estoque no fim do mês. Com exceção do livro <span className="italic">Organizados</span>, itens de pedido especial não estão listados neste formulário, visto que eles não devem ficar em estoque.</li>
                  <li><span className="font-bold">(2) Recebido:</span> Anote a quantidade de cada item recebido durante o mês.</li>
                  <li><span className="font-bold">(3) Saída:</span> Anote a quantidade de cada item que saiu durante o mês. Pode-se determinar essa quantidade por: (1) somar a quantidade em "Estoque" do mês anterior à quantidade anotada em "Recebido" durante o mês atual e depois (2) subtrair desse total a contagem real que acabou de ser feita ("Estoque").</li>
                </ul>
              </li>
              <li>Neste formulário, um asterisco (*) depois do título ou da descrição de um item indica que ele faz parte do Kit de Ensino.</li>
            </ol>
          </div>

          <HistoryTable />

          <div className="mt-8 flex justify-between items-end border-t border-neutral-200 pt-4">
            <span className="text-[10px] font-bold text-neutral-500 italic">S-28-T 8/24</span>
            <span className="text-[10px] font-bold text-black text-right">Este documento é um registro digital das entradas feitas na tela principal.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
