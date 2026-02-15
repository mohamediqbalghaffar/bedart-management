
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
  existingProductNames: z.array(z.string()).describe("An array of existing product names to check against for similarities.")
});
export type ExcelDataInput = z.infer<typeof ExcelDataInputSchema>;

const ProductSchema = z.object({
    product: z.string().describe('The name of the product, translated into Central Kurdish. If a similar product exists in the provided list, use the existing name.'),
    quantity: z.number().describe('The quantity of the product.'),
    unitPrice: z.number().describe('The price of a single unit of the product.'),
    category: z.string().describe('The category of the product, must be one of: Mattress, Bed, Pillow, Cover.'),
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
  prompt: `You are an expert data entry assistant for a purchasing department who is a native Central Kurdish speaker.
Your task is to analyze the provided CSV data and extract a list of products with enhanced details.

The user will provide a CSV string and a list of existing product names.

Your tasks are:
1.  **Identify Columns**: Identify columns representing product name, quantity, and unit price. These columns may be in various languages (e.g., 'Item', 'Product', 'QTY', 'دانە', 'نرخ', 'نرخی تاک').
2.  **Translate to Central Kurdish**: Translate product names into natural and correct Central Kurdish (Sorani).
3.  **Check for Duplicates**: Compare the translated product name with the 'existingProductNames' list. If a very similar product already exists, use the existing name from the list to maintain consistency.
4.  **Categorize Product**: Based on the product name, determine its category. The category must be one of the following (in English): "Mattress", "Bed", "Pillow", "Cover".
5.  **Structure Output**: Return a structured JSON array. Each object must contain 'product' (the final standardized name), 'quantity', 'unitPrice', and 'category'.
6.  **Filter Rows**: Ignore any header rows, empty rows, or rows that contain totals or summaries. Only extract rows that represent individual products.

Existing Product Names:
{{#each existingProductNames}}
- {{{this}}}
{{/each}}

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
