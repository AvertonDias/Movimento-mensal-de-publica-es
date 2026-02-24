
'use client';

import React from 'react';
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
import { Plus, Trash2, Loader2, ClipboardList, Info, CheckCircle2, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  ) || [];

  const handleAddRow = () => {
    if (!activeUserId || !db) return;
    const id = `order_${Date.now()}`;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', id);
    
    setDocumentNonBlocking(docRef, {
      id,
      date: new Date().toLocaleDateString('pt-BR'),
      publisherName: '',
      item: '',
      language: 'Português',
      quantity: '1',
      status: 'env',
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
          <div className="flex items-center gap-3 text-left">
            <div className="bg-primary p-2 rounded-lg">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight">Pedidos Especiais</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Gerenciamento digital do registro oficial.</p>
            </div>
          </div>
        </div>

        {/* DOCUMENTO OFICIAL */}
        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 space-y-6">
          
          <h2 className="text-center text-xl font-black uppercase tracking-[0.1em]">
            REGISTRO DE ITENS DE PEDIDO ESPECIAL
          </h2>

          {/* Quadro de Avisos Oficial */}
          <div className="border border-black bg-neutral-100 p-4 text-center space-y-1 mx-auto max-w-[80%]">
            <p className="text-[11px] font-medium leading-tight">
              Os itens de pedido especial devem ser enviados somente
            </p>
            <p className="text-[11px] font-bold italic leading-tight">
              quando os pedidos são feitos especificamente por um publicador.
            </p>
            <p className="text-[11px] font-medium leading-tight">
              As quantidades dos itens pedidos não devem ser estimativas com base no número de publicadores.
            </p>
          </div>

          {/* Seção de Informações de Itens */}
          <div className="space-y-4 px-2">
            <p className="text-[11px] font-medium">
              Os itens de pedido especial são claramente identificados no JW Hub. Esses itens de pedido especial incluem:
            </p>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] font-medium ml-4">
              <ul className="list-disc space-y-0.5">
                <li>Volumes encadernados</li>
                <li><span className="italic">Examine as Escrituras</span></li>
                <li><span className="italic">Índices</span></li>
                <li>Watchtower Library (CD-ROM)</li>
                <li>Bíblias tamanho grande</li>
              </ul>
              <ul className="list-disc space-y-0.5">
                <li>Todos os livros de letras grandes, exceto cancioneiros</li>
                <li><span className="italic">Proclamadores</span></li>
                <li>Volumes de <span className="italic">Estudo Perspicaz</span></li>
                <li><span className="italic">'Boa Terra'</span></li>
              </ul>
            </div>

            <div className="flex justify-center gap-8 text-[11px] font-medium pt-2 text-center">
              <span className="text-muted-foreground">Descrições da situação do pedido:</span>
              <div className="flex items-center gap-1"><span className="text-[8px]">■</span> Env. = Enviado</div>
              <div className="flex items-center gap-1"><span className="text-[8px]">■</span> Pend. = Pendente</div>
              <div className="flex items-center gap-1"><span className="text-[8px]">■</span> Rec. = Recebido</div>
            </div>
          </div>

          {/* Tabela de Registros */}
          <div className="border-2 border-black">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-neutral-50 font-black uppercase text-center border-b-2 border-black h-12">
                  <th className="border-r border-black p-1 w-[90px] leading-tight">Data do<br/>pedido</th>
                  <th className="border-r border-black p-1 w-[180px] leading-tight">Nome do<br/>publicador</th>
                  <th className="border-r border-black p-1">Item</th>
                  <th className="border-r border-black p-1 w-[100px]">Idioma</th>
                  <th className="border-r border-black p-1 w-[70px]">Quantidade</th>
                  <th className="p-1 w-[140px] leading-tight relative">
                    Situação
                    <div className="flex justify-center gap-3 text-[7px] font-bold mt-1 opacity-60">
                      <span>Env.</span>
                      <span>Pend.</span>
                      <span>Rec.</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isOrdersLoading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto opacity-20" /></td>
                  </tr>
                ) : sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <ClipboardList className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                        <Button variant="outline" size="sm" onClick={handleAddRow} className="mt-2 font-black uppercase text-[9px] print:hidden">
                          Clique no + para começar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-black last:border-0 group hover:bg-primary/5 transition-colors h-12">
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.date ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'date', e.target.value)}
                          className="w-full h-full px-2 bg-transparent text-center font-bold focus:outline-none"
                          placeholder="dd/mm/aa"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.publisherName ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'publisherName', e.target.value)}
                          className="w-full h-full px-3 bg-transparent font-bold focus:outline-none placeholder:text-neutral-200"
                          placeholder="Nome do irmão(ã)"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.item ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'item', e.target.value)}
                          className="w-full h-full px-3 bg-transparent font-bold focus:outline-none placeholder:text-neutral-200"
                          placeholder="Ex: Examine 2026"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.language ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'language', e.target.value)}
                          className="w-full h-full px-2 bg-transparent text-center font-bold focus:outline-none"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.quantity ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'quantity', e.target.value)}
                          className="w-full h-full px-2 bg-transparent text-center font-black focus:outline-none"
                        />
                      </td>
                      <td className="p-1 relative">
                        <div className="flex items-center gap-1">
                          <Select 
                            value={order.status ?? 'env'} 
                            onValueChange={(val) => handleUpdate(order.id, 'status', val)}
                          >
                            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-neutral-100 font-black uppercase text-[9px] shadow-none focus:ring-0 px-2">
                              <div className="flex items-center gap-1.5">
                                {order.status === 'env' && <Send className="h-3 w-3 text-primary" />}
                                {order.status === 'pend' && <Clock className="h-3 w-3 text-amber-500" />}
                                {order.status === 'rec' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="env" className="text-[9px] font-black uppercase">Enviado (Env.)</SelectItem>
                              <SelectItem value="pend" className="text-[9px] font-black uppercase">Pendente (Pend.)</SelectItem>
                              <SelectItem value="rec" className="text-[9px] font-black uppercase">Recebido (Rec.)</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <button 
                            onClick={() => handleDelete(order.id)}
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-full print:hidden"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Botão de Adição no final da tabela */}
            <div className="flex justify-center border-t border-black/10 py-3 bg-neutral-50/30 print:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAddRow}
                className="h-8 w-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white p-0 transition-all active:scale-90"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Rodapé Informativo */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-black/10">
            <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">S-14-T DIGITAL (REGISTRO ESPECIAL)</span>
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/10 print:hidden">
              <Info className="h-3 w-3 text-primary" />
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                Este registro deve ser atualizado mensalmente conforme os pedidos forem recebidos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
