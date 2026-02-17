'use server';
/**
 * @fileOverview Flow to process S-28 form images or PDFs and extract inventory data for multiple months.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessS28InputSchema = z.object({
  files: z.array(z.string()).describe("Array of data URIs (images or PDFs) of the S-28 form pages."),
  currentDate: z.string().optional().describe("ISO string of current date to help resolve month names."),
});
export type ProcessS28Input = z.infer<typeof ProcessS28InputSchema>;

const ProcessS28OutputSchema = z.object({
  months: z.array(z.object({
    monthKey: z.string().describe("ISO month key format 'YYYY-MM'"),
    monthLabel: z.string().describe("The name of the month as seen in the form header"),
    items: z.array(z.object({
      code: z.string().nullable(),
      item: z.string(),
      received: z.number().nullable(),
      current: z.number().nullable(),
    })),
  })),
});
export type ProcessS28Output = z.infer<typeof ProcessS28OutputSchema>;

const s28Prompt = ai.definePrompt({
  name: 'processS28Prompt',
  input: {schema: ProcessS28InputSchema},
  output: {schema: ProcessS28OutputSchema},
  prompt: `Você é um assistente especializado em extração de dados do formulário S-28-T das Testemunhas de Jeová.
Este formulário é uma tabela que contém o movimento mensal de publicações para um período de 6 meses.

Sua tarefa:
1. Identificar os meses listados no cabeçalho da tabela (geralmente 6 colunas de meses, ex: AGO/24, SET/24, etc).
2. Para cada publicação (linha), extrair os valores de "Recebido" e "Estoque" (Atual) para cada um dos meses identificados.
3. Converter os nomes dos meses para o formato de chave 'YYYY-MM'. Use a data atual {{{currentDate}}} como referência para determinar o ano correto se não estiver explícito.

Certifique-se de:
- Extrair o código (N.º) e o nome da publicação corretamente.
- Ignorar linhas sem nenhuma movimentação em nenhum dos meses.
- Retornar um array de meses, onde cada mês contém a sua lista de itens com os respectivos valores encontrados naquela coluna.

Arquivos:
{{#each files}}
{{media url=this}}
{{/each}}`,
});

export async function processS28(input: ProcessS28Input): Promise<ProcessS28Output> {
  try {
    const {output} = await s28Prompt({
      ...input,
      currentDate: input.currentDate || new Date().toISOString()
    });
    if (!output) {
      return { months: [] };
    }
    return output;
  } catch (error) {
    console.error('Genkit S28 processing error:', error);
    throw new Error('Erro ao processar a folha S-28 com IA. Verifique se os arquivos são nítidos e se as colunas de meses estão visíveis.');
  }
}
