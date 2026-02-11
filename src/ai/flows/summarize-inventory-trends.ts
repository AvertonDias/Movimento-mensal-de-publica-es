'use server';

/**
 * @fileOverview Summarizes inventory trends, highlighting popular and stagnant items.
 *
 * - summarizeInventoryTrends - Analyzes inventory data and provides a summary of usage trends.
 * - SummarizeInventoryTrendsInput - The input type for the summarizeInventoryTrends function.
 * - SummarizeInventoryTrendsOutput - The return type for the summarizeInventoryTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInventoryTrendsInputSchema = z.object({
  inventoryData: z.string().describe('The inventory data in a string format, such as CSV or JSON.'),
});
export type SummarizeInventoryTrendsInput = z.infer<typeof SummarizeInventoryTrendsInputSchema>;

const SummarizeInventoryTrendsOutputSchema = z.object({
  summary: z.string().describe('A summary of the inventory trends, highlighting popular and stagnant items.'),
});
export type SummarizeInventoryTrendsOutput = z.infer<typeof SummarizeInventoryTrendsOutputSchema>;

export async function summarizeInventoryTrends(input: SummarizeInventoryTrendsInput): Promise<SummarizeInventoryTrendsOutput> {
  return summarizeInventoryTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeInventoryTrendsPrompt',
  input: {schema: SummarizeInventoryTrendsInputSchema},
  output: {schema: SummarizeInventoryTrendsOutputSchema},
  prompt: `Você é um especialista em análise de inventário. Analise os dados do inventário fornecidos e forneça um resumo das tendências de uso, destacando quais itens estão sendo mais utilizados e quais estão estagnados.

Dados do Inventário:
{{{inventoryData}}}`,
});

const summarizeInventoryTrendsFlow = ai.defineFlow(
  {
    name: 'summarizeInventoryTrendsFlow',
    inputSchema: SummarizeInventoryTrendsInputSchema,
    outputSchema: SummarizeInventoryTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
