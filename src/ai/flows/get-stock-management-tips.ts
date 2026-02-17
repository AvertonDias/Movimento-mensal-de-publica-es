
'use server';
/**
 * @fileOverview This file defines a flow to provide stock management tips based on JW Hub best practices.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StockManagementInputSchema = z.object({
  inventoryData: z.string().describe('Inventory data in a structured format, such as CSV or JSON.'),
});
export type StockManagementInput = z.infer<typeof StockManagementInputSchema>;

const StockManagementOutputSchema = z.object({
  tips: z.string().describe('Personalized stock management tips based on the provided inventory data and JW Hub best practices.'),
});
export type StockManagementOutput = z.infer<typeof StockManagementOutputSchema>;

const tipsPrompt = ai.definePrompt({
  name: 'stockManagementTipsPrompt',
  input: {schema: StockManagementInputSchema},
  output: {schema: StockManagementOutputSchema},
  prompt: `Você é um especialista em gestão de estoque com profundo conhecimento das melhores práticas do JW Hub.

Analise os dados de inventário fornecidos e forneça dicas de gestão de estoque personalizadas para otimizar os processos e evitar o desperdício.

Dados do Inventário:
{{{inventoryData}}}

Dicas:`,
});

export async function getStockManagementTips(input: StockManagementInput): Promise<StockManagementOutput> {
  try {
    const {output} = await tipsPrompt(input);
    if (!output) throw new Error('No output from AI');
    return output;
  } catch (error) {
    console.error('Tips generation error:', error);
    throw new Error('Falha ao gerar dicas de gestão.');
  }
}
