"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, TrendingUp, Lightbulb, Loader2 } from "lucide-react";
import { summarizeInventoryTrends } from "@/ai/flows/summarize-inventory-trends";
import { getStockManagementTips } from "@/ai/flows/get-stock-management-tips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIInsightsProps {
  inventoryData: string;
}

export function AIInsights({ inventoryData }: AIInsightsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [trends, setTrends] = useState<string>('');
  const [tips, setTips] = useState<string>('');

  const handleGetTrends = async () => {
    setLoading('trends');
    try {
      const result = await summarizeInventoryTrends({ inventoryData });
      setTrends(result.summary);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const handleGetTips = async () => {
    setLoading('tips');
    try {
      const result = await getStockManagementTips({ inventoryData });
      setTips(result.tips);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Inteligência Artificial - JW Hub Insights</CardTitle>
        </div>
        <CardDescription>
          Analise seus dados e receba sugestões inteligentes baseadas em boas práticas.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b h-12 bg-transparent px-4">
            <TabsTrigger value="trends" className="gap-2 data-[state=active]:bg-primary/10">
              <TrendingUp className="h-4 w-4" /> Tendências
            </TabsTrigger>
            <TabsTrigger value="tips" className="gap-2 data-[state=active]:bg-primary/10">
              <Lightbulb className="h-4 w-4" /> Dicas de Gestão
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="p-6">
            {!trends ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <p className="text-muted-foreground">Clique para analisar as tendências de uso dos seus itens.</p>
                <Button onClick={handleGetTrends} disabled={loading !== null} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  {loading === 'trends' ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                  Analisar Tendências
                </Button>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="p-4 bg-muted/30 rounded-lg border border-border whitespace-pre-wrap text-sm leading-relaxed">
                  {trends}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleGetTrends} disabled={loading !== null}>
                    Atualizar Análise
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tips" className="p-6">
            {!tips ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <p className="text-muted-foreground">Obtenha dicas personalizadas baseadas no JW Hub para otimizar seu estoque.</p>
                <Button onClick={handleGetTips} disabled={loading !== null} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  {loading === 'tips' ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
                  Gerar Dicas
                </Button>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 whitespace-pre-wrap text-sm leading-relaxed">
                  {tips}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleGetTips} disabled={loading !== null}>
                    Atualizar Dicas
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
