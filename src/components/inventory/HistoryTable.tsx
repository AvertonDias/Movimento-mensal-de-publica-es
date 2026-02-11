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
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format, subMonths } from 'date-fns';
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
  { code: '3142', name: 'Tradução do Novo Mundo (pequena)', abbr: 'nwtpkt', type: 'item' },
  { code: '', name: 'Outras Bíblias', type: 'item' },
  { code: '', name: 'Livros', type: 'category' },
  { code: '5414', name: 'Beneficie-se', abbr: 'be', type: 'item' },
  { code: '5340', name: 'Entenda a Bíblia', abbr: 'bhs', type: 'item' },
  { code: '5416', name: 'Testemunho Cabal', abbr: 'bt', type: 'item' },
  { code: '5231', name: "'Meu Seguidor'", abbr: 'cf', type: 'item' },
  { code: '5331', name: 'Achegue-se', abbr: 'cl', type: 'item' },
  { code: '5419', name: 'Imite', abbr: 'ia', type: 'item' },
  { code: '5425', name: 'Jesus — O Caminho', abbr: 'jy', type: 'item' },
  { code: '5422', name: 'O Reino de Deus Governa!', abbr: 'kr', type: 'item' },
  { code: '5427', name: 'Histórias da Bíblia', abbr: 'lfb', type: 'item' },
  { code: '5445', name: 'Seja Feliz (livro)*', abbr: 'lff', type: 'item' },
  { code: '5415', name: 'Instrutor', abbr: 'lr', type: 'item' },
  { code: '5343', name: 'Continue', abbr: 'lvs', type: 'item' },
  { code: '5332', name: 'Organizados', abbr: 'od', type: 'item' },
  { code: '5435', name: 'Adoração Pura', abbr: 'rr', type: 'item' },
  { code: '5440', name: 'Princípios Bíblicos', abbr: 'scl', type: 'item' },
  { code: '5341', name: 'Cante de Coração', abbr: 'sjj', type: 'item' },
  { code: '5441', name: 'Cante (grande)', abbr: 'sjjls', type: 'item' },
  { code: '5442', name: 'Cante (letras)', abbr: 'sjjyls', type: 'item' },
  { code: '5339', name: 'Jovens Perguntam, Vol. 1', abbr: 'yp1', type: 'item' },
  { code: '5336', name: 'Jovens Perguntam, Vol. 2', abbr: 'yp2', type: 'item' },
  { code: '', name: 'Outros livros', type: 'item' },
  { code: '', name: 'Brochuras e livretos', type: 'category' },
  { code: '6618', name: 'Leitura e Escrita', abbr: 'ay', type: 'item' },
  { code: '6628', name: 'Educação', abbr: 'ed', type: 'item' },
  { code: '6659', name: 'Boas Notícias', abbr: 'fg', type: 'item' },
  { code: '6665', name: 'Família', abbr: 'hf', type: 'item' },
  { code: '6662', name: 'Vida Feliz', abbr: 'hl', type: 'item' },
  { code: '6647', name: 'Vida Satisfatória', abbr: 'la', type: 'item' },
  { code: '6634', name: 'A Vida — Teve Criador?*', abbr: 'lc', type: 'item' },
  { code: '6658', name: 'Escute a Deus', abbr: 'ld', type: 'item' },
  { code: '6655', name: 'Origem da Vida*', abbr: 'lf', type: 'item' },
  { code: '6545', name: 'Seja Feliz (brochura)*', abbr: 'lffi', type: 'item' },
  { code: '6657', name: 'Escute e Viva*', abbr: 'll', type: 'item' },
  { code: '6669', name: 'Ame as Pessoas', abbr: 'lmd', type: 'item' },
  { code: '6663', name: 'Minhas Lições', abbr: 'mb', type: 'item' },
  { code: '6648', name: 'Caminho para a Vida', abbr: 'ol', type: 'item' },
  { code: '6639', name: 'Verdadeira Paz', abbr: 'pc', type: 'item' },
  { code: '6653', name: 'Caminho', abbr: 'ph', type: 'item' },
  { code: '6671', name: 'Volte para Jeová', abbr: 'rj', type: 'item' },
  { code: '6656', name: 'Verdadeira Fé', abbr: 'rk', type: 'item' },
  { code: '6630', name: 'Espíritos dos Mortos', abbr: 'sp', type: 'item' },
  { code: '6667', name: 'Melhore', abbr: 'th', type: 'item' },
  { code: '6670', name: 'Sabedoria de Jesus', abbr: 'wfg', type: 'item' },
  { code: '6684', name: '10 Perguntas', abbr: 'ypq', type: 'item' },
  { code: '', name: 'Outras brochuras', type: 'item' },
  { code: '', name: 'Folhetos e convites', type: 'category' },
  { code: '7305', name: 'Convite*', abbr: 'inv', type: 'item' },
  { code: '7130', name: 'Acha da Bíblia?*', abbr: 'T-30', type: 'item' },
  { code: '7131', name: 'Futuro?*', abbr: 'T-31', type: 'item' },
  { code: '7132', name: 'Família Feliz?*', abbr: 'T-32', type: 'item' },
  { code: '7133', name: 'Quem Controla?*', abbr: 'T-33', type: 'item' },
  { code: '7134', name: 'Sofrimento?*', abbr: 'T-34', type: 'item' },
  { code: '7135', name: 'Voltar a Viver*', abbr: 'T-35', type: 'item' },
  { code: '7136', name: 'Reino*', abbr: 'T-36', type: 'item' },
  { code: '7137', name: 'Respostas Importantes*', abbr: 'T-37', type: 'item' },
  { code: '', name: 'Outros folhetos', type: 'item' },
  { code: '', name: 'Cartões de visita', type: 'category' },
  { code: '8410', name: 'Imagem Bíblia aberta*', abbr: 'jwcd1', type: 'item' },
  { code: '8521', name: 'Apenas o logo*', abbr: 'jwcd4', type: 'item' },
  { code: '8569', name: 'Curso presencial*', abbr: 'jwcd9', type: 'item' },
  { code: '8570', name: 'Curso internet*', abbr: 'jwcd10', type: 'item' },
  { code: '', name: 'Outros cartões', type: 'item' },
  { code: '', name: 'Revistas', type: 'category' },
  { code: '', name: 'Todas as outras revistas', type: 'item' },
];

export function HistoryTable() {
  const { user } = useUser();
  const db = useFirestore();
  const [historyData, setHistoryData] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  const lastSixMonths = useMemo(() => {
    const months = [];
    const baseDate = subMonths(new Date(), 1);
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      months.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR })
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
    const val = historyData[monthKey]?.[itemId]?.[field];
    return val !== undefined && val !== 0 ? val : '';
  };

  const calculateOutgoing = (monthKey: string, itemId: string) => {
    const data = historyData[monthKey]?.[itemId];
    if (!data) return '';
    const prev = Number(data.previous) || 0;
    const rec = Number(data.received) || 0;
    const curr = Number(data.current) || 0;
    const result = (prev + rec) - curr;
    return result !== 0 ? result : '';
  };

  return (
    <div className="border border-black relative overflow-hidden print:border-black">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px] print:hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Sincronizando...</span>
        </div>
      )}
      <Table className="border-collapse table-fixed w-full min-w-[1200px] print:min-w-0">
        <TableHeader>
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-8">
            <TableHead className="w-[60px] text-[8px] font-black uppercase text-black p-0.5 text-center border-black">MÊS</TableHead>
            <TableHead className="w-[180px] border-l-0"></TableHead>
            {lastSixMonths.map((month) => (
              <TableHead 
                key={month.key} 
                colSpan={4} 
                className="text-center text-[8px] font-black uppercase text-black p-0 h-8 border-l border-black bg-neutral-50/50"
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-8">
            <TableHead className="text-[7px] font-bold text-black p-0 text-center leading-none">N.º</TableHead>
            <TableHead className="text-[10px] font-black text-black px-1 py-0 align-middle">Publicações</TableHead>
            
            {lastSixMonths.map((m) => (
              <React.Fragment key={m.key}>
                <TableHead className="text-[6px] font-bold text-black p-0 text-center uppercase leading-[1]">Estoque<br/>ant.</TableHead>
                <TableHead className="text-[6px] font-bold text-black p-0 text-center uppercase leading-[1]">Rec.</TableHead>
                <TableHead className="text-[6px] font-bold text-black p-0 text-center uppercase leading-[1]">Est.</TableHead>
                <TableHead className="text-[6px] font-black text-black p-0 text-center uppercase bg-neutral-200 leading-[1]">Saída</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ITEMS.map((item, idx) => {
            if (item.type === 'category') {
              return (
                <TableRow key={idx} className="border-b border-black bg-neutral-100/50 hover:bg-neutral-100/50 h-5">
                  <TableCell className="p-0 border-r border-black"></TableCell>
                  <TableCell colSpan={26} className="text-[9px] font-black uppercase px-1 py-0 tracking-tight text-black">
                    {item.name}
                  </TableCell>
                </TableRow>
              );
            }
            const itemId = item.code || `item_${idx}`;
            return (
              <TableRow key={idx} className="border-b border-black divide-x divide-black h-5 hover:bg-transparent print:h-4">
                <TableCell className="text-[8px] text-center p-0 font-bold border-black leading-none">{item.code}</TableCell>
                <TableCell className="text-[9px] px-1 py-0 border-black flex justify-between items-center h-full overflow-hidden">
                  <span className="truncate leading-none">{item.name}</span>
                  {item.abbr && <span className="font-bold ml-1 text-[7px] text-neutral-500">{item.abbr}</span>}
                </TableCell>
                
                {lastSixMonths.map((m) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="text-[8px] text-center p-0 font-bold leading-none">{getValue(m.key, itemId, 'previous')}</TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-bold leading-none">{getValue(m.key, itemId, 'received')}</TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-bold leading-none">{getValue(m.key, itemId, 'current')}</TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-black bg-neutral-200 leading-none">{calculateOutgoing(m.key, itemId)}</TableCell>
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
