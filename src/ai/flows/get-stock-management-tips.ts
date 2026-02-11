// src/ai/flows/get-stock-management-tips.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow to provide stock management tips based on JW Hub best practices.
 *
 * - getStockManagementTips - A function that takes inventory data as input and returns personalized stock management tips.
 * - StockManagementInput - The input type for the getStockManagementTips function, representing inventory data.
 * - StockManagementOutput - The output type for the getStockManagementTips function, representing the stock management tips.
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

export async function getStockManagementTips(input: StockManagementInput): Promise<StockManagementOutput> {
  return stockManagementTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stockManagementTipsPrompt',
  input: {schema: StockManagementInputSchema},
  output: {schema: StockManagementOutputSchema},
  prompt: `Você é um especialista em gestão de estoque com profundo conhecimento das melhores práticas do JW Hub.

  Analise os dados de inventário fornecidos e forneça dicas de gestão de estoque personalizadas para otimizar os processos e evitar o desperdício.

  Dados do Inventário:
  {{inventoryData}}

  Dicas:
`,
});

const stockManagementTipsFlow = ai.defineFlow(
  {
    name: 'stockManagementTipsFlow',
    inputSchema: StockManagementInputSchema,
    outputSchema: StockManagementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
