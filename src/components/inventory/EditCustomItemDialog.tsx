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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { InventoryItem } from '@/app/types/inventory';
import { Trash2 } from 'lucide-react';

interface EditCustomItemDialogProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export function EditCustomItemDialog({ item, onClose }: EditCustomItemDialogProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [abbr, setAbbr] = useState('');

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

    onClose();
  };

  const handleDelete = () => {
    if (!user || !db || !item) return;
    
    if (confirm(`Tem certeza que deseja excluir "${item.item}"?`)) {
      const docRef = doc(db, 'users', user.uid, 'inventory', item.id);
      deleteDocumentNonBlocking(docRef);
      onClose();
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Item Personalizado</DialogTitle>
          <DialogDescription>
            Altere as informações do item ou exclua-o permanentemente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-code" className="text-right">Código</Label>
            <Input
              id="edit-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-abbr" className="text-right">Sigla</Label>
            <Input
              id="edit-abbr"
              value={abbr}
              onChange={(e) => setAbbr(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleUpdate} className="bg-primary">Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
