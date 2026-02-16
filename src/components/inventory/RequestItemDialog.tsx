
"use client"

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { InventoryItem, ItemRequest } from '@/app/types/inventory';
import { PackageSearch, CheckCircle2, Truck, PlusCircle, Hash, StickyNote, Trash2, History, CalendarDays, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface RequestItemDialogProps {
  item: InventoryItem | null;
  onClose: () => void;
  targetUserId?: string;
}

export function RequestItemDialog({ item, onClose, targetUserId }: RequestItemDialogProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState<string>('');
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [requestDate, setRequestDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [confirmingRequestId, setConfirmingRequestId] = useState<string | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState<string>('');
  const [receiveDate, setReceiveDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const activeUid = targetUserId || user?.uid;

  const requestsQuery = useMemoFirebase(() => {
    if (!db || !activeUid || !item) return null;
    return collection(db, 'users', activeUid, 'inventory', item.id, 'requests');
  }, [db, activeUid, item]);

  const { data: allRequests } = useCollection<ItemRequest>(requestsQuery);

  const pendingRequests = allRequests?.filter(r => r.status === 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  const receivedRequests = allRequests?.filter(r => r.status === 'received').sort((a, b) => new Date(b.receivedAt || b.createdAt).getTime() - new Date(a.receivedAt || a.createdAt).getTime()).slice(0, 8) || [];

  useEffect(() => {
    if (!item) {
      setRequestQuantity('');
      setRequestNotes('');
      setRequestDate(format(new Date(), 'yyyy-MM-dd'));
      setConfirmingRequestId(null);
    }
  }, [item]);

  if (!item) return null;

  const handleAddRequest = () => {
    if (!activeUid || !db || !item) return;
    
    if (!requestQuantity || Number(requestQuantity) <= 0) {
      toast({
        variant: "destructive",
        title: "Quantidade Inválida",
        description: "Por favor, informe a quantidade do pedido.",
      });
      return;
    }

    setIsLoading(true);

    const requestId = `req_${Date.now()}`;
    const reqDocRef = doc(db, 'users', activeUid, 'inventory', item.id, 'requests', requestId);
    
    // Define a data escolhida com meio-dia para evitar problemas de fuso horário
    const finalRequestDate = new Date(requestDate + 'T12:00:00').toISOString();

    const newRequest: ItemRequest = {
      id: requestId,
      quantity: Number(requestQuantity),
      notes: requestNotes || '',
      status: 'pending',
      createdAt: finalRequestDate
    };

    setDocumentNonBlocking(reqDocRef, newRequest, { merge: true });

    const itemDocRef = doc(db, 'users', activeUid, 'inventory', item.id);
    setDocumentNonBlocking(itemDocRef, {
      pendingRequestsCount: (item.pendingRequestsCount || 0) + 1,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Pedido registrado!",
      description: `Solicitados ${requestQuantity} un. de "${item.item}" em ${format(new Date(finalRequestDate), 'dd/MM/yyyy')}.`,
    });

    setRequestQuantity('');
    setRequestNotes('');
    setRequestDate(format(new Date(), 'yyyy-MM-dd'));
    setIsLoading(false);
  };

  const handleMarkAsReceived = (req: ItemRequest) => {
    if (!activeUid || !db || !item) return;

    const finalQty = Number(receiveQuantity) || req.quantity;
    const reqDocRef = doc(db, 'users', activeUid, 'inventory', item.id, 'requests', req.id);
    
    const finalDate = new Date(receiveDate + 'T12:00:00');

    setDocumentNonBlocking(reqDocRef, {
      status: 'received',
      receivedAt: finalDate.toISOString(),
      quantity: finalQty
    }, { merge: true });

    const itemDocRef = doc(db, 'users', activeUid, 'inventory', item.id);
    setDocumentNonBlocking(itemDocRef, {
      pendingRequestsCount: Math.max(0, (item.pendingRequestsCount || 1) - 1),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Pedido recebido!",
      description: `Foram registradas ${finalQty} un. entregues em ${format(finalDate, 'dd/MM/yyyy')}.`,
    });

    setConfirmingRequestId(null);
  };

  const handleDeleteRequest = (req: ItemRequest) => {
    if (!activeUid || !db || !item) return;

    const reqDocRef = doc(db, 'users', activeUid, 'inventory', item.id, 'requests', req.id);
    deleteDocumentNonBlocking(reqDocRef);

    if (req.status === 'pending') {
      const itemDocRef = doc(db, 'users', activeUid, 'inventory', item.id);
      setDocumentNonBlocking(itemDocRef, {
        pendingRequestsCount: Math.max(0, (item.pendingRequestsCount || 1) - 1),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    toast({
      variant: "destructive",
      title: "Pedido removido",
      description: "O registro do pedido foi excluído.",
    });
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <PackageSearch className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-lg tracking-tight">Controle de Pedidos</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-bold uppercase text-muted-foreground text-left">
            {item.item} {item.code ? `(${item.code})` : ''}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                  <Truck className="h-3 w-3" /> Pedidos Pendentes ({pendingRequests.length})
                </p>
              </div>
              
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Nenhum pedido a caminho</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge className="bg-amber-500 font-black text-[10px] uppercase">Qtd: {req.quantity}</Badge>
                          <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter">
                            Solicitado em {format(new Date(req.createdAt), "dd/MM/yy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {confirmingRequestId !== req.id ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setConfirmingRequestId(req.id);
                                setReceiveQuantity(req.quantity.toString());
                              }}
                              className="h-8 text-[9px] font-black uppercase tracking-widest border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-white"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Recebido
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setConfirmingRequestId(null)}
                              className="h-8 w-8 text-neutral-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteRequest(req)}
                            className="h-8 w-8 text-neutral-400 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {confirmingRequestId === req.id && (
                        <div className="bg-white p-3 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1">
                                  <Hash className="h-3 w-3" /> Qtd. Recebida
                                </Label>
                                <Input 
                                  type="number" 
                                  value={receiveQuantity}
                                  onChange={(e) => setReceiveQuantity(e.target.value)}
                                  className="h-9 text-xs font-bold border-emerald-100 focus:ring-emerald-500"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" /> Data
                                </Label>
                                <Input 
                                  type="date" 
                                  value={receiveDate}
                                  onChange={(e) => setReceiveDate(e.target.value)}
                                  className="h-9 text-xs font-bold border-emerald-100 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-9"
                              onClick={() => handleMarkAsReceived(req)}
                            >
                              Confirmar Recebimento
                            </Button>
                          </div>
                        </div>
                      )}

                      {req.notes && !confirmingRequestId && (
                        <p className="text-[11px] text-amber-900 font-medium bg-white/50 p-2 rounded-lg leading-tight border border-amber-100/50 italic">
                          "{req.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="bg-neutral-100" />

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary px-1">Novo Pedido</p>
              <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="req-qty" className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-primary" /> Quantidade
                    </Label>
                    <Input 
                      id="req-qty"
                      type="number"
                      placeholder="0"
                      value={requestQuantity}
                      onChange={(e) => setRequestQuantity(e.target.value)}
                      className="font-black h-11 text-center text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-date" className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 text-primary" /> Data do Pedido
                    </Label>
                    <Input 
                      id="req-date"
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                      className="font-bold h-11 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="req-notes" className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <StickyNote className="h-3 w-3 text-primary" /> Observações (Opcional)
                    </Label>
                    <Input 
                      id="req-notes"
                      placeholder="Ex: Campanha especial, Pedido para o irmão..."
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="font-bold h-11 text-xs"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddRequest}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 font-black uppercase text-xs h-12 shadow-md gap-2"
                >
                  <PlusCircle className="h-4 w-4" /> Adicionar Novo Pedido
                </Button>
              </div>
            </div>

            {receivedRequests.length > 0 && (
              <div className="space-y-3 pb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 px-1 flex items-center gap-2">
                  <History className="h-3 w-3" /> Histórico de Recebimento
                </p>
                <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
                  {receivedRequests.map((req, idx) => (
                    <div key={req.id} className={cn(
                      "p-3 flex justify-between items-center",
                      idx !== receivedRequests.length - 1 && "border-b border-neutral-100"
                    )}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black">{req.quantity} un.</span>
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                            Entregue em {format(new Date(req.receivedAt || req.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-300 hover:text-destructive" onClick={() => handleDeleteRequest(req)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 bg-neutral-50 border-t border-neutral-100 shrink-0">
          <Button variant="ghost" onClick={onClose} className="w-full font-black uppercase text-[10px] tracking-widest">
            Fechar Painel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
