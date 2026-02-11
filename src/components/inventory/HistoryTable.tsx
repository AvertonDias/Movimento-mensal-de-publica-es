"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  { code: '', name: 'Todas as outras revistas para o público', type: 'item' },
];

export function HistoryTable() {
  const { user } = useUser();
  const db = useFirestore();
  const [historyData, setHistoryData] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  // Calcula os últimos 6 meses (baseado no mês anterior ao atual)
  const lastSixMonths = useMemo(() => {
    const months = [];
    const baseDate = subMonths(new Date(), 1);
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      months.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM yy', { locale: ptBR })
      });
    }
    return months;
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      if (!user || !db) return;
      setLoading(true);
      const allMonthsData: Record<string, Record<string, any>> = {};

      try {
        for (const month of lastSixMonths) {
          const colRef = collection(db, 'users', user.uid, 'monthly_records', month.key, 'items');
          const snapshot = await getDocs(colRef);
          const monthItems: Record<string, any> = {};
          snapshot.forEach(doc => {
            monthItems[doc.id] = doc.data();
          });
          allMonthsData[month.key] = monthItems;
        }
        setHistoryData(allMonthsData);
      } catch (e) {
        console.error("Erro ao buscar histórico:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user, db, lastSixMonths]);

  const getValue = (monthKey: string, itemId: string, field: string) => {
    return historyData[monthKey]?.[itemId]?.[field] ?? '';
  };

  const calculateOutgoing = (monthKey: string, itemId: string) => {
    const data = historyData[monthKey]?.[itemId];
    if (!data) return '';
    const prev = Number(data.previous) || 0;
    const rec = Number(data.received) || 0;
    const curr = Number(data.current) || 0;
    return (prev + rec) - curr;
  };

  return (
    <div className="border border-black relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Sincronizando registros...</span>
        </div>
      )}
      <Table className="border-collapse table-fixed w-full">
        <TableHeader>
          {/* Row 1: Months */}
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-10">
            <TableHead className="w-[80px] text-[10px] font-black uppercase text-black p-1 text-center align-bottom border-black">MÊS E ANO</TableHead>
            <TableHead className="w-[280px] border-l-0"></TableHead>
            {lastSixMonths.map((month) => (
              <TableHead 
                key={month.key} 
                colSpan={month === lastSixMonths[0] ? 4 : 3} 
                className="text-center text-[10px] font-black uppercase text-black p-0 h-10 border-l border-black bg-neutral-50/50"
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          {/* Row 2: Sub-labels */}
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-12">
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none">N.º do item</TableHead>
            <TableHead className="text-[12px] font-black text-black p-2 align-bottom">Publicações</TableHead>
            
            {/* First Month Headers */}
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-[1.1] uppercase">Estoque<br/>anterior</TableHead>
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Recebido</TableHead>
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Estoque</TableHead>
            <TableHead className="text-[8px] font-black text-black p-0 text-center leading-none uppercase bg-neutral-200">Saída</TableHead>
            
            {/* Other Months Headers */}
            {lastSixMonths.slice(1).map((m) => (
              <React.Fragment key={m.key}>
                <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Recebido</TableHead>
                <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none uppercase">Estoque</TableHead>
                <TableHead className="text-[8px] font-black text-black p-0 text-center leading-none uppercase bg-neutral-200">Saída</TableHead>
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
            const itemId = item.code || `item_${idx}`;
            return (
              <TableRow key={idx} className="border-b border-black divide-x divide-black h-6 hover:bg-transparent">
                <TableCell className="text-[9px] text-center p-0 font-bold border-black">{item.code}</TableCell>
                <TableCell className="text-[10px] px-2 py-0 border-black flex justify-between items-center h-full">
                  <span className="truncate leading-none">{item.name}</span>
                  {item.abbr && <span className="font-bold ml-1 text-[9px] min-w-[30px] text-right">{item.abbr}</span>}
                </TableCell>
                
                {/* 1st Month Data */}
                <TableCell className="text-[9px] text-center p-0 font-bold">{getValue(lastSixMonths[0].key, itemId, 'previous')}</TableCell>
                <TableCell className="text-[9px] text-center p-0 font-bold">{getValue(lastSixMonths[0].key, itemId, 'received')}</TableCell>
                <TableCell className="text-[9px] text-center p-0 font-bold">{getValue(lastSixMonths[0].key, itemId, 'current')}</TableCell>
                <TableCell className="text-[10px] text-center p-0 font-black bg-neutral-200">{calculateOutgoing(lastSixMonths[0].key, itemId)}</TableCell>

                {/* Other Months Data */}
                {lastSixMonths.slice(1).map((m) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="text-[9px] text-center p-0 font-bold">{getValue(m.key, itemId, 'received')}</TableCell>
                    <TableCell className="text-[9px] text-center p-0 font-bold">{getValue(m.key, itemId, 'current')}</TableCell>
                    <TableCell className="text-[10px] text-center p-0 font-black bg-neutral-200">{calculateOutgoing(m.key, itemId)}</TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
