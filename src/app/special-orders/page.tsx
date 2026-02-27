'use client';

import React, { useMemo, useEffect, useState } from 'react';
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
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ClipboardList, 
  Info, 
  CheckCircle2, 
  Clock, 
  Send, 
  Smartphone,
  CalendarDays,
  User,
  BookOpen,
  Globe,
  Hash,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from 'date-fns';

export default function SpecialOrdersPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const hasCleanedUp = React.useRef(false);
  const isMobile = useIsMobile();

  // Estados do Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newOrderForm, setNewOrderForm] = useState({
    date: format(new Date(), 'dd/MM/yyyy'),
    publisherName: '',
    item: '',
    language: 'Português',
    quantity: '1',
  });

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

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }, [orders]);

  useEffect(() => {
    if (!isOrdersLoading && orders && orders.length > 0 && !hasCleanedUp.current && db && activeUserId) {
      orders.forEach(order => {
        const isEmpty = !order.publisherName || order.publisherName.trim() === "";
        if (isEmpty) {
          const docRef = doc(db, 'users', activeUserId, 'special_orders', order.id);
          deleteDocumentNonBlocking(docRef);
        }
      });
      hasCleanedUp.current = true;
    }
  }, [isOrdersLoading, orders, db, activeUserId]);

  const handleSaveNewOrder = () => {
    if (!activeUserId || !db || !newOrderForm.publisherName.trim()) return;

    const id = `order_${Date.now()}`;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', id);
    
    setDocumentNonBlocking(docRef, {
      ...newOrderForm,
      id,
      status: 'pend',
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Registro salvo!",
      description: `O pedido de "${newOrderForm.item}" foi adicionado com sucesso.`,
    });

    setNewOrderForm({
      date: format(new Date(), 'dd/MM/yyyy'),
      publisherName: '',
      item: '',
      language: 'Português',
      quantity: '1',
    });
    setIsAddModalOpen(false);
  };

  const handleUpdate = (id: string, field: string, value: string) => {
    if (!activeUserId || !db) return;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', id);
    setDocumentNonBlocking(docRef, { [field]: value }, { merge: true });
  };

  const confirmDelete = () => {
    if (!activeUserId || !db || !deleteConfirmId) return;
    const docRef = doc(db, 'users', activeUserId, 'special_orders', deleteConfirmId);
    deleteDocumentNonBlocking(docRef);
    setDeleteConfirmId(null);
    toast({ variant: "destructive", title: "Registro removido" });
  };

  if (isUserLoading || isCheckingHelper || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 print:p-0 print:bg-white font-body text-black">
      <div className="max-w-[1000px] mx-auto space-y-6 print:space-y-0">
        
        {isMobile && (
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 landscape:hidden">
            <div className="bg-primary/20 p-2 rounded-lg animate-rotate-phone">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase text-foreground leading-tight tracking-wider text-left">
              Dica: aproveite ao máximo o aplicativo usando o celular na horizontal ou acessando-o pelo computador.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm print:hidden text-left">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight">Pedidos Especiais</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Gerenciamento digital do registro oficial.</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Registro
          </Button>
        </div>

        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 space-y-6">
          
          <h2 className="text-center text-xl font-black uppercase tracking-[0.1em]">
            REGISTRO DE ITENS DE PEDIDO ESPECIAL
          </h2>

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
                      <span>Pend.</span>
                      <span>Env.</span>
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
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <ClipboardList className="h-12 w-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                        <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)} className="mt-2 font-black uppercase text-[9px] print:hidden">
                          Clique no + para começar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
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
                          className="w-full h-full px-3 bg-transparent font-bold focus:outline-none placeholder:text-neutral-200 uppercase"
                          placeholder="Nome do irmão(ã)"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.item ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'item', e.target.value)}
                          className="w-full h-full px-3 bg-transparent font-bold focus:outline-none placeholder:text-neutral-200 uppercase"
                          placeholder="Ex: Examine 2026"
                        />
                      </td>
                      <td className="border-r border-black p-0">
                        <input 
                          type="text" 
                          value={order.language ?? ''} 
                          onChange={(e) => handleUpdate(order.id, 'language', e.target.value)}
                          className="w-full h-full px-2 bg-transparent text-center font-bold focus:outline-none uppercase"
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
                            value={order.status ?? 'pend'} 
                            onValueChange={(val) => handleUpdate(order.id, 'status', val)}
                          >
                            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-neutral-100 font-black uppercase text-[9px] shadow-none focus:ring-0 px-2">
                              <div className="flex items-center gap-1.5">
                                {order.status === 'pend' && <Clock className="h-3 w-3 text-amber-500" />}
                                {order.status === 'env' && <Send className="h-3 w-3 text-primary" />}
                                {order.status === 'rec' && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pend" className="text-[9px] font-black uppercase">Pendente (Pend.)</SelectItem>
                              <SelectItem value="env" className="text-[9px] font-black uppercase">Enviado (Env.)</SelectItem>
                              <SelectItem value="rec" className="text-[9px] font-black uppercase">Recebido (Rec.)</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <button 
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="text-destructive p-1.5 hover:bg-destructive/10 bg-destructive/5 border border-destructive/10 rounded-full print:hidden transition-colors"
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
            
            <div className="flex justify-center border-t border-black/10 py-3 bg-neutral-50/30 print:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAddModalOpen(true)}
                className="h-8 w-8 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white p-0 transition-all active:scale-90"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-black/10">
            <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">S-14-T DIGITAL (REGISTRO ESPECIAL)</span>
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/10 print:hidden text-left">
              <Info className="h-3 w-3 text-primary" />
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-tight">
                Este registro deve ser atualizado mensalmente conforme os pedidos forem recebidos. Linhas vazias são removidas ao atualizar a página.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Novo Registro */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="uppercase font-black text-lg tracking-tight">Novo Pedido Especial</DialogTitle>
            </div>
            <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">
              Cadastre um item solicitado especificamente por um publicador.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <User className="h-3 w-3 text-primary" /> Nome do Publicador
              </Label>
              <Input 
                placeholder="Ex: João Silva" 
                value={newOrderForm.publisherName}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, publisherName: e.target.value }))}
                className="font-bold uppercase h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 text-primary" /> Nome da Publicação
              </Label>
              <Input 
                placeholder="Ex: Examine as Escrituras 2026" 
                value={newOrderForm.item}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, item: e.target.value }))}
                className="font-bold uppercase h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-primary" /> Idioma
                </Label>
                <Input 
                  value={newOrderForm.language}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, language: e.target.value }))}
                  className="font-bold uppercase h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-primary" /> Quantidade
                </Label>
                <Input 
                  type="number"
                  value={newOrderForm.quantity}
                  onChange={(e) => setNewOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="font-black text-center h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-primary" /> Data do Pedido
              </Label>
              <Input 
                value={newOrderForm.date}
                onChange={(e) => setNewOrderForm(prev => ({ ...prev, date: e.target.value }))}
                className="font-bold h-11 text-center"
                placeholder="dd/mm/aa"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col gap-3">
            <Button 
              onClick={handleSaveNewOrder}
              disabled={!newOrderForm.publisherName.trim() || !newOrderForm.item.trim()}
              className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-lg gap-2"
            >
              <Save className="h-4 w-4" /> Salvar Registro
            </Button>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="w-full font-bold uppercase text-[10px] tracking-widest h-10">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 uppercase font-black text-destructive text-left">
              <AlertTriangle className="h-5 w-5" />
              Remover Registro?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold uppercase text-xs leading-relaxed text-left">
              Deseja realmente excluir este pedido especial? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black uppercase text-[10px] tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
