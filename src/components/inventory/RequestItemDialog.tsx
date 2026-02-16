
"use client"

import React, { useState } from 'react';
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
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { InventoryItem } from '@/app/types/inventory';
import { PackageSearch, Clock, CheckCircle2, Truck, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

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

  if (!item) return null;

  const activeUid = targetUserId || user?.uid;

  const handleUpdateRequest = (status: 'pending' | 'received' | 'none') => {
    if (!activeUid || !db || !item) return;
    setIsLoading(true);

    const docRef = doc(db, 'users', activeUid, 'inventory', item.id);
    const updates: any = {
      id: item.id,
      item: item.item,
      category: item.category,
      code: item.code,
      abbr: item.abbr || '',
      lastRequestStatus: status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'pending') {
      updates.lastRequestDate = new Date().toISOString();
    }

    setDocumentNonBlocking(docRef, updates, { merge: true });

    toast({
      title: status === 'pending' ? "Pedido registrado!" : (status === 'received' ? "Pedido entregue!" : "Pedido removido"),
      description: `O status da publicação "${item.item}" foi atualizado.`,
    });

    setIsLoading(false);
    onClose();
  };

  const getStatusBadge = () => {
    switch (item.lastRequestStatus) {
      case 'pending':
        return <Badge className="bg-amber-500 hover:bg-amber-600 gap-1.5 font-black uppercase text-[10px]"><Truck className="h-3 w-3" /> Pedido a Caminho</Badge>;
      case 'received':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1.5 font-black uppercase text-[10px]"><CheckCircle2 className="h-3 w-3" /> Último Pedido Recebido</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground font-black uppercase text-[10px]">Sem pedidos recentes</Badge>;
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <PackageSearch className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-lg tracking-tight">Controle de Pedido</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">
            {item.item} {item.code ? `(${item.code})` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4">
            {getStatusBadge()}
            
            {item.lastRequestDate ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Última ação: {format(new Date(item.lastRequestDate), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
            ) : (
              <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Nenhum histórico de pedido</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 px-1">Ações Disponíveis</p>
            <div className="grid gap-2">
              <Button 
                onClick={() => handleUpdateRequest('pending')}
                disabled={isLoading || item.lastRequestStatus === 'pending'}
                className="w-full bg-primary hover:bg-primary/90 font-black uppercase text-xs h-12 shadow-md gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Marcar Novo Pedido
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateRequest('received')}
                  disabled={isLoading || item.lastRequestStatus !== 'pending'}
                  className="font-black uppercase text-[10px] h-11 border-emerald-200 hover:bg-emerald-50 text-emerald-600 gap-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Recebido
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => handleUpdateRequest('none')}
                  disabled={isLoading || item.lastRequestStatus === 'none'}
                  className="font-black uppercase text-[10px] h-11 text-neutral-400"
                >
                  Limpar Status
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-neutral-50 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose} className="w-full font-black uppercase text-[10px] tracking-widest">
            Fechar Painel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
