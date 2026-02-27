"use client"

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Settings2, Trash2, Plus, AlertTriangle } from "lucide-react";
import { InventoryColumn, ColumnType } from "@/app/types/inventory";

interface ColumnManagerProps {
  columns: InventoryColumn[];
  setColumns: (cols: InventoryColumn[]) => void;
}

export function ColumnManager({ columns, setColumns }: ColumnManagerProps) {
  const [newColHeader, setNewColHeader] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [deleteConfirmColId, setDeleteConfirmColId] = useState<string | null>(null);

  const handleAddColumn = () => {
    if (!newColHeader) return;
    const newCol: InventoryColumn = {
      id: `custom_${Date.now()}`,
      header: newColHeader,
      type: newColType,
      isCustom: true
    };
    setColumns([...columns, newCol]);
    setNewColHeader('');
  };

  const confirmRemoveColumn = () => {
    if (!deleteConfirmColId) return;
    setColumns(columns.filter(c => c.id !== deleteConfirmColId));
    setDeleteConfirmColId(null);
  };

  const colToDelete = columns.find(c => c.id === deleteConfirmColId);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings2 className="h-4 w-4" /> Colunas
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Colunas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adicionar Nova Coluna</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ex: Localização, Fornecedor" 
                  value={newColHeader}
                  onChange={(e) => setNewColHeader(e.target.value)}
                />
                <Select value={newColType} onValueChange={(v: ColumnType) => setNewColType(v)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddColumn} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Colunas Atuais</Label>
              <div className="border rounded-md divide-y overflow-hidden max-h-[300px] overflow-y-auto">
                {columns.map(col => (
                  <div key={col.id} className="flex items-center justify-between p-3 bg-white">
                    <div>
                      <span className="font-medium text-sm">{col.header}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({col.type})</span>
                    </div>
                    {col.isCustom && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeleteConfirmColId(col.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!col.isCustom && (
                      <span className="text-xs text-muted-foreground italic mr-2">Sistema</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmColId} onOpenChange={(open) => !open && setDeleteConfirmColId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 uppercase font-black text-destructive text-left">
              <AlertTriangle className="h-5 w-5" />
              Remover Coluna?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left font-bold uppercase text-xs leading-relaxed">
              Deseja realmente remover a coluna <span className="text-foreground">"{colToDelete?.header}"</span>? Todos os dados preenchidos nela nesta sessão serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black uppercase text-[10px] tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveColumn}
              className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest"
            >
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
