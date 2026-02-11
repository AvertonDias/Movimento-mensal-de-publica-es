
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { InventoryItem } from '@/app/types/inventory';
import { Trash2, Save, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface EditCustomItemDialogProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export function EditCustomItemDialog({ item, onClose }: EditCustomItemDialogProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [abbr, setAbbr] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.item);
      setCode(item.code || '');
      setAbbr(item.abbr || '');
    }
  }, [item]);

  const handleUpdate = () => {
    if (!user || !db || !item || !name) return;

    const docRef = doc(db, 'users', user.uid, 'inventory', item.id);

    setDocumentNonBlocking(docRef, {
      item: name,
      code: code || '',
      abbr: abbr || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: "Item atualizado!",
      description: `As alterações em "${name}" foram salvas.`,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!user || !db || !item) return;
    
    const docRef = doc(db, 'users', user.uid, 'inventory', item.id);
    deleteDocumentNonBlocking(docRef);
    
    toast({
      variant: "destructive",
      title: "Item excluído",
      description: `A publicação "${item.item}" foi removida do seu inventário.`,
    });
    
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-lg">Editar Publicação</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">
              Personalize os detalhes ou remova este item do seu repertório.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-widest ml-1">Nome da Publicação</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code" className="text-[10px] font-black uppercase tracking-widest ml-1">N.º (Código)</Label>
                <Input
                  id="edit-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-abbr" className="text-[10px] font-black uppercase tracking-widest ml-1">Sigla</Label>
                <Input
                  id="edit-abbr"
                  value={abbr}
                  onChange={(e) => setAbbr(e.target.value)}
                  className="font-bold uppercase"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDeleteOpen(true)} 
              className="gap-2 w-full sm:w-auto text-destructive hover:bg-destructive/10 border-destructive/20 font-bold uppercase text-[10px] tracking-widest h-11"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none font-bold uppercase text-[10px] tracking-widest h-11">
                Cancelar
              </Button>
              <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none gap-2 font-bold uppercase text-[10px] tracking-widest h-11 shadow-lg">
                <Save className="h-3.5 w-3.5" /> Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black">Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente a publicação <span className="font-bold text-foreground">"{item?.item}"</span>. 
              Os registros de meses anteriores não serão afetados, mas o item não aparecerá mais na sua lista de contagem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 font-bold uppercase text-xs">
              Sim, Excluir Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
