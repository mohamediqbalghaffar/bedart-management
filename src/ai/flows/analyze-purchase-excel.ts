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
  excelDataUri: z
    .string()
    .describe(
      "A Base64-encoded Excel file as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExcelDataInput = z.infer<typeof ExcelDataInputSchema>;

const ProductSchema = z.object({
    product: z.string().describe('The name of the product.'),
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
Your task is to analyze the provided Excel file data and extract a list of products.

The user will provide an Excel file encoded as a data URI. You need to identify columns that represent the product name, quantity, and unit price. These columns might have different names like 'Item', 'Product', 'QTY', 'دانە', 'نرخ', 'نرخی تاک', etc.

Extract this information and return it as a structured JSON array, where each object contains 'product', 'quantity', and 'unitPrice'. Ignore any header rows or totals.

Excel File Data:
{{media url=excelDataUri}}`,
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
