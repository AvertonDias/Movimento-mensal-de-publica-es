
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface AddCustomItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export function AddCustomItemDialog({ isOpen, onClose, category }: AddCustomItemDialogProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [abbr, setAbbr] = useState('');

  const handleAdd = () => {
    if (!user || !db || !name) return;

    const id = `custom_${Date.now()}`;
    const docRef = doc(db, 'users', user.uid, 'inventory', id);

    setDocumentNonBlocking(docRef, {
      id,
      item: name,
      code: code || '',
      abbr: abbr || '',
      category,
      isCustom: true,
      sortOrder: Date.now(), // Adiciona o campo de ordem
      createdAt: new Date().toISOString()
    }, { merge: true });

    setName('');
    setCode('');
    setAbbr('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Item em "{category}"</DialogTitle>
          <DialogDescription>
            Insira os detalhes da nova publicação ou item para esta categoria.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Novo Folheto"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">Código</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="col-span-3"
              placeholder="Ex: 7138"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="abbr" className="text-right">Sigla</Label>
            <Input
              id="abbr"
              value={abbr}
              onChange={(e) => setAbbr(e.target.value)}
              className="col-span-3"
              placeholder="Ex: T-38"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} className="bg-primary">Adicionar Linha</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
