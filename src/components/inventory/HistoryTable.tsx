"use client"

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MONTHS = [
  "set./mar.", "out./abr.", "nov./mai.", "dez./jun.", "jan./jul.", "fev./ago."
];

interface PublicationItem {
  code: string;
  name: string;
  abbr?: string;
  type: 'category' | 'item';
}

const ITEMS: PublicationItem[] = [
  { code: '', name: 'Bíblias', type: 'category' },
  { code: '3140', name: 'Tradução do Novo Mundo', abbr: 'nwt', type: 'item' },
  { code: '3142', name: 'Tradução do Novo Mundo (tamanho pequeno)', abbr: 'nwtpkt', type: 'item' },
  { code: '', name: 'Outras Bíblias', type: 'item' },
  { code: '', name: 'Livros', type: 'category' },
  { code: '5414', name: 'Beneficie-se', abbr: 'be', type: 'item' },
  { code: '5340', name: 'Entenda a Bíblia', abbr: 'bhs', type: 'item' },
  { code: '5416', name: 'Testemunho Cabal', abbr: 'bt', type: 'item' },
  { code: '5231', name: "'Meu Seguidor'", abbr: 'cf', type: 'item' },
  { code: '5331', name: 'Achegue-se', abbr: 'cl', type: 'item' },
  { code: '5419', name: 'Imite', abbr: 'ia', type: 'item' },
  { code: '5425', name: 'Jesus — O Caminho', abbr: 'jy', type: 'item' },
  { code: '5422', name: 'O Reino de Deus já Governa!', abbr: 'kr', type: 'item' },
  { code: '5427', name: 'Histórias da Bíblia', abbr: 'lfb', type: 'item' },
  { code: '5445', name: 'Seja Feliz para Sempre! (livro)*', abbr: 'lff', type: 'item' },
  { code: '5415', name: 'Instrutor', abbr: 'lr', type: 'item' },
  { code: '5343', name: 'Continue', abbr: 'lvs', type: 'item' },
  { code: '5332', name: 'Organizados', abbr: 'od', type: 'item' },
  { code: '5435', name: 'Adoração Pura', abbr: 'rr', type: 'item' },
  { code: '5440', name: 'Princípios Bíblicos para a Vida Cristã', abbr: 'scl', type: 'item' },
  { code: '5341', name: 'Cante de Coração', abbr: 'sjj', type: 'item' },
  { code: '5441', name: 'Cante de Coração (tamanho grande)', abbr: 'sjjls', type: 'item' },
  { code: '5442', name: 'Cante de Coração — Apenas Letras', abbr: 'sjjyls', type: 'item' },
  { code: '5339', name: 'Jovens Perguntam, Volume 1', abbr: 'yp1', type: 'item' },
  { code: '5336', name: 'Jovens Perguntam, Volume 2', abbr: 'yp2', type: 'item' },
  { code: '', name: 'Outros livros', type: 'item' },
  { code: '', name: 'Brochuras e livretos', type: 'category' },
  { code: '6618', name: 'Leitura e Escrita', abbr: 'ay', type: 'item' },
  { code: '6628', name: 'Educação', abbr: 'ed', type: 'item' },
  { code: '6659', name: 'Boas Notícias', abbr: 'fg', type: 'item' },
  { code: '6665', name: 'Família', abbr: 'hf', type: 'item' },
  { code: '6662', name: 'Vida Feliz', abbr: 'hl', type: 'item' },
  { code: '6647', name: 'Vida Satisfatória', abbr: 'la', type: 'item' },
  { code: '6634', name: 'A Vida — Teve um Criador?*', abbr: 'lc', type: 'item' },
  { code: '6658', name: 'Escute a Deus', abbr: 'ld', type: 'item' },
  { code: '6655', name: 'Origem da Vida*', abbr: 'lf', type: 'item' },
  { code: '6545', name: 'Seja Feliz para Sempre! (brochura)*', abbr: 'lffi', type: 'item' },
  { code: '6657', name: 'Escute e Viva*', abbr: 'll', type: 'item' },
  { code: '6669', name: 'Ame as Pessoas', abbr: 'lmd', type: 'item' },
  { code: '6663', name: 'Minhas Lições da Bíblia', abbr: 'mb', type: 'item' },
  { code: '6648', name: 'Caminho para a Vida', abbr: 'ol', type: 'item' },
  { code: '6639', name: 'Verdadeira Paz e Felicidade', abbr: 'pc', type: 'item' },
  { code: '6653', name: 'Caminho', abbr: 'ph', type: 'item' },
  { code: '6671', name: 'Volte para Jeová', abbr: 'rj', type: 'item' },
  { code: '6656', name: 'Verdadeira Fé', abbr: 'rk', type: 'item' },
  { code: '6630', name: 'Espíritos dos Mortos', abbr: 'sp', type: 'item' },
  // Início da Página 2
  { code: '6667', name: 'Melhore', abbr: 'th', type: 'item' },
  { code: '6670', name: 'Aprenda com a Sabedoria de Jesus', abbr: 'wfg', type: 'item' },
  { code: '6684', name: '10 Perguntas', abbr: 'ypq', type: 'item' },
  { code: '', name: 'Outras brochuras e livretos', type: 'item' },
  { code: '', name: 'Folhetos e convites (1 maço de 2,5 cm = 300)', type: 'category' },
  { code: '7305', name: 'Convite para reuniões cristãs*', abbr: 'inv', type: 'item' },
  { code: '7130', name: 'O Que Você Acha da Bíblia?*', abbr: 'T-30', type: 'item' },
  { code: '7131', name: 'O Que Você Espera do Futuro?*', abbr: 'T-31', type: 'item' },
  { code: '7132', name: 'Segredo para Família Feliz*', abbr: 'T-32', type: 'item' },
  { code: '7133', name: 'Quem Controla o Mundo?*', abbr: 'T-33', type: 'item' },
  { code: '7134', name: 'O Sofrimento Vai Acabar?*', abbr: 'T-34', type: 'item' },
  { code: '7135', name: 'Voltar a Viver*', abbr: 'T-35', type: 'item' },
  { code: '7136', name: 'Reino*', abbr: 'T-36', type: 'item' },
  { code: '7137', name: 'Respostas Importantes*', abbr: 'T-37', type: 'item' },
  { code: '', name: 'Outros folhetos e convites', type: 'item' },
  { code: '', name: 'Cartões de visita', type: 'category' },
  { code: '8410', name: 'Cartão de visita (imagem da Bíblia aberta)*', abbr: 'jwcd1', type: 'item' },
  { code: '8521', name: 'Cartão de visita (apenas o logo do jw.org)*', abbr: 'jwcd4', type: 'item' },
  { code: '8569', name: 'Cartão de visita (curso bíblico presencial)*', abbr: 'jwcd9', type: 'item' },
  { code: '8570', name: 'Cartão de visita (curso bíblico pela internet)*', abbr: 'jwcd10', type: 'item' },
  { code: '', name: 'Outros cartões de visita', type: 'item' },
  { code: '', name: 'Revistas para o público', type: 'category' },
  { code: '', name: 'Despertai! N.º 1 2018*', abbr: 'g18.1', type: 'item' },
  { code: '', name: 'Despertai! N.º 2 2018*', abbr: 'g18.2', type: 'item' },
  { code: '', name: 'Despertai! N.º 3 2018*', abbr: 'g18.3', type: 'item' },
  { code: '', name: 'Despertai! N.º 1 2019*', abbr: 'g19.1', type: 'item' },
  { code: '', name: 'Despertai! N.º 2 2019*', abbr: 'g19.2', type: 'item' },
  { code: '', name: 'Despertai! N.º 3 2019*', abbr: 'g19.3', type: 'item' },
  { code: '', name: 'Despertai! N.º 1 2020*', abbr: 'g20.1', type: 'item' },
  { code: '', name: 'Despertai! N.º 2 2020*', abbr: 'g20.2', type: 'item' },
  { code: '', name: 'Despertai! N.º 3 2020*', abbr: 'g20.3', type: 'item' },
  { code: '', name: 'Despertai! N.º 1 2021*', abbr: 'g21.1', type: 'item' },
  { code: '', name: 'Despertai! N.º 2 2021*', abbr: 'g21.2', type: 'item' },
  { code: '', name: 'Despertai! N.º 3 2021*', abbr: 'g21.3', type: 'item' },
  { code: '', name: 'Despertai! N.º 1 2022*', abbr: 'g22.1', type: 'item' },
  { code: '', name: 'Despertai! N.º 1 2023*', abbr: 'g23.1', type: 'item' },
  { code: '', name: 'Sentinela N.º 1 2018*', abbr: 'wp18.1', type: 'item' },
  { code: '', name: 'Sentinela N.º 2 2018*', abbr: 'wp18.2', type: 'item' },
  { code: '', name: 'Sentinela N.º 3 2018*', abbr: 'wp18.3', type: 'item' },
  { code: '', name: 'Sentinela N.º 1 2019*', abbr: 'wp19.1', type: 'item' },
  { code: '', name: 'Sentinela N.º 2 2019*', abbr: 'wp19.2', type: 'item' },
  { code: '', name: 'Sentinela N.º 3 2019*', abbr: 'wp19.3', type: 'item' },
  { code: '', name: 'Sentinela N.º 1 2020*', abbr: 'wp20.1', type: 'item' },
  { code: '', name: 'Sentinela N.º 2 2020*', abbr: 'wp20.2', type: 'item' },
  { code: '', name: 'Sentinela N.º 3 2020*', abbr: 'wp20.3', type: 'item' },
  { code: '', name: 'Sentinela N.º 1 2021*', abbr: 'wp21.1', type: 'item' },
  { code: '', name: 'Sentinela N.º 2 2021*', abbr: 'wp21.2', type: 'item' },
  { code: '', name: 'Sentinela N.º 3 2021*', abbr: 'wp21.3', type: 'item' },
  { code: '', name: 'Sentinela N.º 1 2022*', abbr: 'wp22.1', type: 'item' },
  { code: '', name: 'Sentinela N.º 1 2023*', abbr: 'wp23.1', type: 'item' },
  { code: '', name: 'Todas as outras revistas para o público', type: 'item' },
];

export function HistoryTable() {
  return (
    <div className="border border-black">
      <Table className="border-collapse table-fixed w-full">
        <TableHeader>
          {/* Row 1: Months */}
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-10">
            <TableHead className="w-[80px] text-[10px] font-black uppercase text-black p-1 text-center align-bottom border-black">MÊS E ANO</TableHead>
            <TableHead className="w-[280px] border-l-0"></TableHead>
            {MONTHS.map((month, idx) => (
              <TableHead 
                key={month} 
                colSpan={idx === 0 ? 4 : 3} 
                className="text-center text-[11px] font-black uppercase text-black p-0 h-10 border-l border-black"
              >
                {month}
              </TableHead>
            ))}
          </TableRow>
          {/* Row 2: Sub-labels */}
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-12">
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none">N.º do item</TableHead>
            <TableHead className="text-[12px] font-black text-black p-2 align-bottom">Publicações</TableHead>
            {/* First Month Headers */}
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Estoque anterior</TableHead>
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Recebido</TableHead>
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Estoque</TableHead>
            <TableHead className="text-[8px] font-black text-black p-0 text-center leading-none uppercase bg-neutral-300/80">Saída</TableHead>
            {/* Other Months Headers */}
            {MONTHS.slice(1).map((m) => (
              <React.Fragment key={m}>
                <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Recebido</TableHead>
                <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Estoque</TableHead>
                <TableHead className="text-[8px] font-black text-black p-0 text-center leading-none uppercase bg-neutral-300/80">Saída</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ITEMS.map((item, idx) => {
            if (item.type === 'category') {
              return (
                <TableRow key={idx} className="border-b-2 border-black bg-neutral-100/50 hover:bg-neutral-100/50 h-7">
                  <TableCell className="p-0 border-r border-black"></TableCell>
                  <TableCell colSpan={20} className="text-[11px] font-black uppercase px-2 py-1 tracking-wider text-black">
                    {item.name}
                  </TableCell>
                </TableRow>
              );
            }
            return (
              <TableRow key={idx} className="border-b border-black divide-x divide-black h-6 hover:bg-transparent">
                <TableCell className="text-[9px] text-center p-0 font-bold border-black">{item.code}</TableCell>
                <TableCell className="text-[10px] px-2 py-0 border-black flex justify-between items-center h-full">
                  <span className="truncate leading-none">{item.name}</span>
                  {item.abbr && <span className="font-bold ml-1 text-[9px] min-w-[30px] text-right">{item.abbr}</span>}
                </TableCell>
                {/* 19 Data Columns */}
                {Array.from({ length: 19 }).map((_, i) => (
                  <TableCell 
                    key={i} 
                    className={cn(
                      "p-0 border-black",
                      // Saída columns: index 3, 6, 9, 12, 15, 18
                      (i === 3 || (i > 3 && (i - 3) % 3 === 0)) ? "bg-neutral-300/80" : ""
                    )}
                  ></TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
