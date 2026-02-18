
'use client';

import React, { useState } from 'react';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  useDoc
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, ClipboardList, Info, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export default function SpecialOrdersPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite, isLoading: isCheckingHelper } = useDoc(helperInviteRef);
  const activeUserId = helperInvite ? helperInvite.ownerId : user?.uid;

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !activeUserId) return null;
    return collection(db, 'users', activeUserId, 'special_orders');
  }, [db, activeUserId]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const sortedOrders = orders?.sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ) || [];

  const handleAddRow = () => {
    if (!activeUserId || !db) return;
    const id = `order_${Date.now()}`;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', id);
    
    setDocumentNonBlocking(docRef, {
      id,
      date: '',
      publisherName: '',
      item: '',
      language: '',
      quantity: '',
      status: 'pend',
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleUpdate = (id: string, field: string, value: string) => {
    if (!activeUserId || !db) return;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', id);
    setDocumentNonBlocking(docRef, { [field]: value }, { merge: true });
  };

  const handleDelete = (id: string) => {
    if (!activeUserId || !db) return;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', id);
    deleteDocumentNonBlocking(docRef);
    toast({ variant: "destructive", title: "Registro removido" });
  };

  if (isUserLoading || isCheckingHelper || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 print:p-0 print:bg-white font-body text-black">
      <div className="max-w-[1000px] mx-auto space-y-6 print:space-y-0">
        
        {/* Ações de Topo */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-sm font-black uppercase tracking-tight">Registro de Pedidos Especiais</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddRow} className="gap-2 font-black uppercase text-[10px] h-9">
              <Plus className="h-4 w-4" /> Novo Registro
            </Button>
          </div>
        </div>

        {/* DOCUMENTO OFICIAL */}
        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 space-y-8">
          
          <h2 className="text-center text-xl font-black uppercase tracking-widest border-b-2 border-black pb-2">
            REGISTRO DE ITENS DE PEDIDO ESPECIAL
          </h2>

          {/* Quadro de Avisos */}
          <div className="border border-black bg-neutral-100 p-4 text-center space-y-1">
            <p className="text-[11px] font-bold italic leading-tight">
              Os itens de pedido especial devem ser enviados somente<br />
              quando os pedidos são feitos especificamente por um publicador.
            </p>
            <p className="text-[11px] font-bold italic leading-tight">
              As quantidades dos itens pedidos não devem ser estimativas com base no número de publicadores.
            </p>
          </div>

          {/* Descrição e Lista */}
          <div className="space-y-4">
            <p className="text-[11px] font-medium text-justify">
              Os itens de pedido especial são claramente identificados no JW Hub. Esses itens de pedido especial incluem:
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] font-medium pl-4">
              <div className="flex items-center gap-2"><span>•</span> <span>Volumes encadernados</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Todos os livros de letras grandes, exceto cancioneiros</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Examine as Escrituras</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Proclamadores</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Índices</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Volumes de Estudo Perspicaz</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Watchtower Library (CD-ROM)</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>'Boa Terra'</span></div>
              <div className="flex items-center gap-2"><span>•</span> <span>Bíblias tamanho grande</span></div>
            </div>
          </div>

          {/* Legenda de Situação */}
          <div className="flex justify-center gap-8 text-[11px] font-bold border-t border-b border-black/10 py-2">
            <span>Descrições da situação do pedido:</span>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-black" /> Env. = Enviado</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-black" /> Pend. = Pendente</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-black" /> Rec. = Recebido</div>
          </div>

          {/* Tabela de Registros */}
          <div className="border-2 border-black">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-neutral-50 font-black uppercase text-center border-b-2 border-black">
                  <th className="border-r border-black p-2 w-[100px]">Data do pedido</th>
                  <th className="border-r border-black p-2 w-[180px]">Nome do publicador</th>
                  <th className="border-r border-black p-2">Item</th>
                  <th className="border-r border-black p-2 w-[100px]">Idioma</th>
                  <th className="border-r border-black p-2 w-[80px]">Quantidade</th>
                  <th className="p-2 w-[120px]">Situação</th>
                </tr>
              </thead>
              <tbody>
                {isOrdersLoading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto opacity-20" /></td>
                  </tr>
                ) : sortedOrders.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-black last:border-0 h-10">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td></td>
                    </tr>
                  ))
                ) : (
                  sortedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-black last:border-0 group hover:bg-primary/5 transition-colors">
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.date} 
                          onChange={(e) => handleUpdate(order.id, 'date', e.target.value)}
                          className="w-full h-10 px-2 bg-transparent text-center font-bold focus:outline-none"
                          placeholder="dd/mm/aa"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.publisherName} 
                          onChange={(e) => handleUpdate(order.id, 'publisherName', e.target.value)}
                          className="w-full h-10 px-2 bg-transparent font-bold focus:outline-none"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.item} 
                          onChange={(e) => handleUpdate(order.id, 'item', e.target.value)}
                          className="w-full h-10 px-2 bg-transparent font-bold focus:outline-none"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.language} 
                          onChange={(e) => handleUpdate(order.id, 'language', e.target.value)}
                          className="w-full h-10 px-2 bg-transparent text-center font-bold focus:outline-none"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.quantity} 
                          onChange={(e) => handleUpdate(order.id, 'quantity', e.target.value)}
                          className="w-full h-10 px-2 bg-transparent text-center font-black focus:outline-none"
                        />
                      </td>
                      <td className="p-1 relative">
                        <div className="flex flex-col gap-1 text-[8px] font-black uppercase text-center h-full justify-center">
                          <div className="flex justify-around items-center px-1">
                            <span>Env.</span>
                            <span>Pend.</span>
                            <span>Rec.</span>
                          </div>
                          <div className="flex justify-around items-center">
                            <input 
                              type="radio" 
                              checked={order.status === 'env'} 
                              onChange={() => handleUpdate(order.id, 'status', 'env')}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <input 
                              type="radio" 
                              checked={order.status === 'pend'} 
                              onChange={() => handleUpdate(order.id, 'status', 'pend')}
                              className="w-3 h-3 cursor-pointer"
                            />
                            <input 
                              type="radio" 
                              checked={order.status === 'rec'} 
                              onChange={() => handleUpdate(order.id, 'status', 'rec')}
                              className="w-3 h-3 cursor-pointer"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(order.id)}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-end pt-4 opacity-40">
            <span className="text-[8px] font-bold">S-14-T DIGITAL (REGISTRO ESPECIAL)</span>
            <div className="flex flex-col items-center gap-1 bg-neutral-100 p-2 rounded print:hidden">
              <Info className="h-3 w-3 text-primary" />
              <p className="text-[7px] font-bold uppercase text-muted-foreground">Clique nas opções para mudar a situação.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
