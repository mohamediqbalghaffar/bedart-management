
'use server';
/**
 * @fileOverview An AI agent for analyzing purchase data from document files (images/PDFs/Excel).
 *
 * - analyzePurchaseExcel - A function that parses a document file and extracts product data.
 * - ExcelDataInput - The input type for the function.
 * - ExcelDataOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExcelDataInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (image, PDF, or Excel file) of a purchase receipt or invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
  name: 'analyzePurchaseDocumentPrompt',
  input: {schema: ExcelDataInputSchema},
  output: {schema: ExcelDataOutputSchema},
  prompt: `You are an expert data entry assistant for a purchasing department who is a native Central Kurdish speaker.
Your task is to analyze the provided document (which could be an image, PDF, or an Excel file) of a purchase receipt or invoice and extract a list of products with enhanced details.

You will extract data from the document. The user will provide the document and a list of existing product names.

Your tasks are:
1.  **Extract Line Items**: Identify the table or list of products in the document. Extract the product name, quantity, and unit price for each line item.
2.  **Translate to Central Kurdish**: If the product names are not in Kurdish, translate them into natural and correct Central Kurdish (Sorani).
3.  **Check for Duplicates/Similarities**: Compare the extracted product name with the 'existingProductNames' list. If a very similar product already exists, you MUST use the existing name from the list to maintain consistency.
4.  **Categorize Product**: Based on the product name, determine its category. The category must be one of the following (in English): "Mattress", "Bed", "Pillow", "Cover".
5.  **Structure Output**: Return a structured JSON array. Each object must contain 'product' (the final standardized name), 'quantity', 'unitPrice', and 'category'.
6.  **Filter Items**: Ignore any header text, totals, taxes, or other non-product information. Only extract rows that represent individual products.

Existing Product Names:
{{#each existingProductNames}}
- {{{this}}}
{{/each}}

Document:
{{media url=documentDataUri}}`,
});

const analyzePurchaseExcelFlow = ai.defineFlow(
  {
    name: 'analyzePurchaseDocumentFlow',
    inputSchema: ExcelDataInputSchema,
    outputSchema: ExcelDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
