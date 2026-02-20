'use server';
/**
 * @fileOverview An AI agent for analyzing purchase receipts from Excel files.
 *
 * - analyzePurchaseExcel - A function that parses an Excel file and extracts structured purchase items.
 * - AnalyzePurchaseExcelInput - The input type for the function.
 * - AnalyzePurchaseExcelOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePurchaseExcelInputSchema = z.object({
  purchaseDataAsCsv: z
    .string()
    .describe(
      "A CSV string representing the purchased products, extracted from a spreadsheet."
    ),
  existingProductNames: z.array(z.string()).describe("A list of existing product names in the database for fuzzy matching and normalization."),
});
export type AnalyzePurchaseExcelInput = z.infer<typeof AnalyzePurchaseExcelInputSchema>;

const PurchaseItemSchema = z.object({
  product: z.string().describe("The normalized product name, matched against the existing product names list."),
  quantity: z.coerce.number().describe("The quantity of the product purchased."),
  unitPrice: z.coerce.number().describe("The purchase price per unit of the product."),
  sellingPrice: z.coerce.number().describe("The intended selling price per unit of the product."),
  category: z.enum(['Mattress', 'Bed', 'Pillow', 'Cover']).describe("The product category, inferred from the product name."),
});

const AnalyzePurchaseExcelOutputSchema = z.array(PurchaseItemSchema);

export type AnalyzePurchaseExcelOutput = z.infer<typeof AnalyzePurchaseExcelOutputSchema>;

export async function analyzePurchaseExcel(input: AnalyzePurchaseExcelInput): Promise<AnalyzePurchaseExcelOutput> {
  return analyzePurchaseExcelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePurchaseExcelPrompt',
  input: {schema: AnalyzePurchaseExcelInputSchema},
  output: {schema: AnalyzePurchaseExcelOutputSchema},
  prompt: `You are an expert data entry assistant for a mattress and bedding store. Your task is to analyze the provided CSV data that contains a list of purchased products and extract the data into a structured format.

You will be given the data as a CSV string and a list of official product names currently in the store's database.

Your tasks are:
1.  **Analyze the CSV Data**: Read the following CSV data:
    {{{purchaseDataAsCsv}}}
    The columns might be in any order and the headers could be in Kurdish or English. Identify columns that correspond to:
    *   Product Name (e.g., 'ناوی کاڵا', 'Product', 'ناو')
    *   Quantity (e.g., 'دانە', 'Qty')
    *   Purchase Price (e.g., 'نرخی کڕین', 'Purchase Price', 'نرخی کرین')
    *   Selling Price (e.g., 'نرخی فرۆشتن', 'Selling Price')

2.  **Extract Row Data**: For each row that represents a product, extract the values.

3.  **Normalize Product Names**: For each extracted product name, find the CLOSEST match from the provided list of existing product names:
    {{#each existingProductNames}}
    - {{{this}}}
    {{/each}}
    Use the official name from the list in your output. This corrects for typos or slight variations in the input file.

4.  **Infer Category**: Based on the normalized product name, determine the most appropriate category. The category MUST be one of: "Mattress", "Bed", "Pillow", "Cover".

5.  **Structure the Output**: Return an array of objects, where each object represents a product from the spreadsheet and matches the PurchaseItemSchema. Ensure all numeric fields are correctly parsed as numbers. If a selling price is not found for an item, default it to 0.

6.  **Filter**: Ignore any header rows, empty rows, or rows that contain totals or summaries.
`,
});

const analyzePurchaseExcelFlow = ai.defineFlow(
  {
    name: 'analyzePurchaseExcelFlow',
    inputSchema: AnalyzePurchaseExcelInputSchema,
    outputSchema: AnalyzePurchaseExcelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
