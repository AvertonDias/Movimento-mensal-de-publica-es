'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  X,
  Scan,
  CalendarDays
} from "lucide-react";
import { processS28 } from "@/ai/flows/process-s28-flow";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from "@/lib/utils";

interface S28ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthKey: string;
}

export function S28ImportModal({ isOpen, onClose, monthKey }: S28ImportModalProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCamera && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          console.error("Erro ao acessar câmera:", err);
          setShowCamera(false);
          toast({
            variant: "destructive",
            title: "Erro na Câmera",
            description: "Não foi possível acessar a câmera do dispositivo.",
          });
        });
    }
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera, toast]);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUri = canvas.toDataURL('image/jpeg');
        setFiles(prev => [...prev, dataUri]);
        setShowCamera(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFiles(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!user || !db || files.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await processS28({ 
        files, 
        currentDate: new Date().toISOString() 
      });
      
      if (result.months && result.months.length > 0) {
        let totalItemsProcessed = 0;
        
        result.months.forEach(monthData => {
          const targetMonthKey = monthData.monthKey;
          
          monthData.items.forEach(item => {
            const itemId = item.code || item.item.toLowerCase().replace(/\s+/g, '_');
            const docRef = doc(db, 'users', user.uid, 'monthly_records', targetMonthKey, 'items', itemId);
            
            setDocumentNonBlocking(docRef, {
              ...item,
              id: itemId,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            totalItemsProcessed++;
          });
        });

        toast({
          title: "Importação Concluída!",
          description: `Detectados ${result.months.length} meses. Total de ${totalItemsProcessed} registros atualizados com sucesso.`,
        });
        setFiles([]);
        onClose();
      } else {
        toast({
          variant: "destructive",
          title: "Dados não identificados",
          description: "A IA não conseguiu ler as colunas de meses. Tente fotos mais nítidas e enquadradas.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: "Ocorreu uma falha ao analisar os documentos. Verifique sua conexão.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10 shrink-0 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Scan className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-lg tracking-tight">Importar Folha S-28</DialogTitle>
          </div>
          <DialogDescription className="text-xs font-bold uppercase text-muted-foreground">
            A IA irá ler as colunas de <strong>6 meses</strong> da sua folha S-28-T e preencher o histórico completo automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {showCamera ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] shadow-inner">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
                <Button variant="outline" onClick={() => setShowCamera(false)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 w-12 rounded-full p-0">
                  <X className="h-6 w-6" />
                </Button>
                <Button onClick={handleCapture} className="bg-white text-black hover:bg-neutral-200 h-12 w-12 rounded-full p-0 shadow-xl">
                  <div className="h-8 w-8 rounded-full border-4 border-black/20" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 font-black uppercase text-[10px] tracking-widest border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="h-6 w-6 text-primary" />
                  Tirar Foto
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 font-black uppercase text-[10px] tracking-widest border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 text-primary" />
                  Subir Arquivo
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,application/pdf" 
                  multiple 
                  onChange={handleFileUpload} 
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      Arquivos Adicionados ({files.length})
                    </p>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-primary uppercase">
                      <CalendarDays className="h-3 w-3" />
                      Lendo 6 meses
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-lg border-2 border-neutral-100 overflow-hidden group shadow-sm bg-neutral-50">
                        {file.startsWith('data:application/pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                            <FileText className="h-8 w-8 text-primary/40" />
                            <span className="text-[8px] font-black text-neutral-400 uppercase">PDF</span>
                          </div>
                        ) : (
                          <Image src={file} alt="Preview" fill className="object-cover" />
                        )}
                        <button 
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[3/4] rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-1 hover:bg-neutral-50 text-neutral-400 hover:text-primary hover:border-primary transition-all"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-[8px] font-black uppercase">Mais</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-neutral-50 border-t border-neutral-100 shrink-0">
          <div className="flex flex-col gap-3 w-full">
            <Button 
              disabled={files.length === 0 || isProcessing} 
              onClick={handleProcess}
              className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest shadow-lg gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Lendo 6 meses da folha...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Histórico (6 Meses)
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="w-full font-bold uppercase text-[10px] tracking-widest h-10">
              Cancelar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
