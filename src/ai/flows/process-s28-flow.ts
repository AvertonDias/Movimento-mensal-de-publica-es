
'use server';
/**
 * @fileOverview Flow to process S-28 form images or PDFs and extract inventory data.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessS28InputSchema = z.object({
  files: z.array(z.string()).describe("Array of data URIs (images or PDFs) of the S-28 form pages."),
});
export type ProcessS28Input = z.infer<typeof ProcessS28InputSchema>;

const ProcessS28OutputSchema = z.object({
  items: z.array(z.object({
    code: z.string().nullable(),
    item: z.string(),
    previous: z.number().nullable(),
    received: z.number().nullable(),
    current: z.number().nullable(),
  })),
});
export type ProcessS28Output = z.infer<typeof ProcessS28OutputSchema>;

const s28Prompt = ai.definePrompt({
  name: 'processS28Prompt',
  input: {schema: ProcessS28InputSchema},
  output: {schema: ProcessS28OutputSchema},
  prompt: `Você é um assistente especializado em extração de dados de formulários das Testemunhas de Jeová.
Analise os arquivos fornecidos da folha S-28 (Movimento Mensal de Publicações).
Sua tarefa é extrair os dados da tabela para preenchimento digital.

Para cada linha que contenha valores numéricos em "Anterior", "Recebido" ou "Estoque" (Atual), extraia:
- N.º (Código da publicação)
- Publicação (Nome completo da publicação)
- Anterior (Quantidade no início do mês)
- Recebido (Quantidade recebida no mês)
- Estoque (Quantidade contada no final do mês)

Certifique-se de ignorar linhas que não tenham nenhuma movimentação ou estoque.
Se houver múltiplas imagens, combine todos os dados em um único array.

Arquivos:
{{#each files}}
{{media url=this}}
{{/each}}`,
});

export async function processS28(input: ProcessS28Input): Promise<ProcessS28Output> {
  try {
    const {output} = await s28Prompt(input);
    if (!output) {
      return { items: [] };
    }
    return output;
  } catch (error) {
    console.error('Genkit S28 processing error:', error);
    throw new Error('Erro ao processar a folha S-28 com IA. Verifique se os arquivos são nítidos.');
  }
}
