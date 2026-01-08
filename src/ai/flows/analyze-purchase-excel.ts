
'use server';
/**
 * @fileOverview An AI agent for analyzing purchase data from Excel files.
 *
 * - analyzePurchaseExcel - A function that parses an Excel file and extracts product data.
 * - ExcelDataInput - The input type for the analyzePurchaseExcel function.
 * - ExcelDataOutput - The return type for the analyzePurchaseExcel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExcelDataInputSchema = z.object({
  excelDataAsCsv: z
    .string()
    .describe(
      "A CSV string extracted from an Excel file."
    ),
});
export type ExcelDataInput = z.infer<typeof ExcelDataInputSchema>;

const ProductSchema = z.object({
    product: z.string().describe('The name of the product, including any size or model details.'),
    quantity: z.number().describe('The quantity of the product.'),
    unitPrice: z.number().describe('The price of a single unit of the product.'),
});

const ExcelDataOutputSchema = z.array(ProductSchema);

export type ExcelDataOutput = z.infer<typeof ExcelDataOutputSchema>;

export async function analyzePurchaseExcel(input: ExcelDataInput): Promise<ExcelDataOutput> {
  return analyzePurchaseExcelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePurchaseExcelPrompt',
  input: {schema: ExcelDataInputSchema},
  output: {schema: ExcelDataOutputSchema},
  prompt: `You are an expert data entry assistant for a purchasing department.
Your task is to analyze the provided CSV data and extract a list of products.

The user will provide a CSV string. You need to identify columns that represent the product name, quantity, and unit price. These columns might have different names like 'Item', 'Product', 'QTY', 'دانە', 'نرخ', 'نرخی تاک', 'Product Name', etc.

- The product name may include size or model information. Combine them into a single 'product' field.
- Extract this information and return it as a structured JSON array, where each object contains 'product', 'quantity', and 'unitPrice'.
- Ignore any header rows, empty rows, or rows that contain totals or summaries. Only extract rows that represent individual products.

CSV Data:
{{{excelDataAsCsv}}}`,
});

const analyzePurchaseExcelFlow = ai.defineFlow(
  {
    name: 'analyzePurchaseExcelFlow',
    inputSchema: ExcelDataInputSchema,
    outputSchema: ExcelDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
