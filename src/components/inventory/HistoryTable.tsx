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
import { InventoryItem } from "@/app/types/inventory";

export function HistoryTable() {
  // Dados de exemplo que seriam carregados do Firestore no futuro
  const items: InventoryItem[] = [
    { id: '1', code: '3140', item: 'Tradução do Novo Mundo (nwt)', category: 'Bíblias', previous: 212, received: 0, current: 181 },
    { id: '2', code: '3142', item: 'Tradução do Novo Mundo - Bolso (nwtpkt)', category: 'Bíblias', previous: 45, received: 10, current: 32 },
    { id: '3', code: '5414', item: 'Beneficie-se (be)', category: 'Livros', previous: 15, received: 0, current: 12 },
    { id: '4', code: '5340', item: 'Entenda a Bíblia (bhs)', category: 'Livros', previous: 30, received: 50, current: 65 },
    { id: '5', code: '5445', item: 'Seja Feliz para Sempre! - livro (lff)', category: 'Livros', previous: 120, received: 100, current: 150 },
    { id: '6', code: '6618', item: 'Leitura e Escrita (ay)', category: 'Brochuras e livretos', previous: 10, received: 0, current: 8 },
    { id: '7', code: '6545', item: 'Seja Feliz para Sempre! - brochura (lffi)', category: 'Brochuras e livretos', previous: 80, received: 40, current: 95 },
    { id: '8', code: '6659', item: 'Boas Notícias (fg)', category: 'Brochuras e livretos', previous: 50, received: 0, current: 42 },
  ];

  const calculateTotal = (item: InventoryItem) => {
    return (Number(item.previous) || 0) + (Number(item.received) || 0);
  };

  const calculateOutgoing = (item: InventoryItem) => {
    return calculateTotal(item) - (Number(item.current) || 0);
  };

  return (
    <div className="border-x-0 border-y border-black">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-neutral-100 hover:bg-neutral-100 border-b-2 border-black">
            <TableHead className="w-[100px] border-r border-black font-bold text-black text-[10px] uppercase h-10">N.º Item</TableHead>
            <TableHead className="border-r border-black font-bold text-black text-[10px] uppercase">Publicação</TableHead>
            <TableHead className="w-[80px] border-r border-black font-bold text-black text-[10px] text-center uppercase leading-tight">Anterior</TableHead>
            <TableHead className="w-[80px] border-r border-black font-bold text-black text-[10px] text-center uppercase leading-tight">Recebido</TableHead>
            <TableHead className="w-[80px] border-r border-black font-bold text-black text-[10px] text-center uppercase leading-tight bg-neutral-200/50">Total</TableHead>
            <TableHead className="w-[80px] border-r border-black font-bold text-black text-[10px] text-center uppercase leading-tight">Estoque</TableHead>
            <TableHead className="w-[80px] font-bold text-black text-[10px] text-center uppercase leading-tight bg-neutral-200/50">Saída</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-transparent border-b border-black h-10">
              <TableCell className="border-r border-black font-bold text-center text-xs">{item.code}</TableCell>
              <TableCell className="border-r border-black text-xs font-semibold uppercase">{item.item}</TableCell>
              <TableCell className="border-r border-black text-center font-medium text-xs">{item.previous}</TableCell>
              <TableCell className="border-r border-black text-center font-medium text-xs">{item.received}</TableCell>
              <TableCell className="border-r border-black text-center font-black text-xs bg-neutral-50">{calculateTotal(item)}</TableCell>
              <TableCell className="border-r border-black text-center font-medium text-xs">{item.current}</TableCell>
              <TableCell className="text-center font-black text-xs bg-neutral-50">{calculateOutgoing(item)}</TableCell>
            </TableRow>
          ))}
          {/* Linha de Totais Finais */}
          <TableRow className="bg-neutral-100/50 font-bold border-t-2 border-black">
             <TableCell colSpan={2} className="border-r border-black text-right text-[10px] uppercase pr-4">Totais do Mês:</TableCell>
             <TableCell className="border-r border-black text-center text-xs">{items.reduce((acc, curr) => acc + (Number(curr.previous) || 0), 0)}</TableCell>
             <TableCell className="border-r border-black text-center text-xs">{items.reduce((acc, curr) => acc + (Number(curr.received) || 0), 0)}</TableCell>
             <TableCell className="border-r border-black text-center text-xs bg-neutral-100">{items.reduce((acc, curr) => acc + calculateTotal(curr), 0)}</TableCell>
             <TableCell className="border-r border-black text-center text-xs">{items.reduce((acc, curr) => acc + (Number(curr.current) || 0), 0)}</TableCell>
             <TableCell className="text-center text-xs bg-neutral-100">{items.reduce((acc, curr) => acc + calculateOutgoing(curr), 0)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
