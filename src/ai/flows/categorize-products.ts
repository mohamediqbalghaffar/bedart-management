'use server';
/**
 * @fileOverview An AI agent for categorizing products.
 *
 * - categorizeProducts - A function that takes product names and assigns a category.
 * - CategorizeProductsInput - The input type for the function.
 * - CategorizeProductsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeProductsInputSchema = z.array(z.string().describe("A product name to be categorized."));
export type CategorizeProductsInput = z.infer<typeof CategorizeProductsInputSchema>;

const CategorizedProductSchema = z.object({
  productName: z.string().describe("The original product name."),
  category: z.enum(['Mattress', 'Bed', 'Pillow', 'Cover']).describe("The assigned category for the product."),
});

const CategorizeProductsOutputSchema = z.array(CategorizedProductSchema);
export type CategorizeProductsOutput = z.infer<typeof CategorizeProductsOutputSchema>;

export async function categorizeProducts(input: CategorizeProductsInput): Promise<CategorizeProductsOutput> {
  return categorizeProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeProductsPrompt',
  input: {schema: CategorizeProductsInputSchema},
  output: {schema: CategorizeProductsOutputSchema},
  prompt: `You are an expert data assistant for a bedding and mattress store.
Your task is to analyze a list of product names and assign a category to each one.

The category MUST be one of the following: "Mattress", "Bed", "Pillow", "Cover".

For each product name in the input array, determine the most appropriate category and return an object with the original 'productName' and the assigned 'category'.

Product Names:
{{#each this}}
- {{{this}}}
{{/each}}
`,
});

const categorizeProductsFlow = ai.defineFlow(
  {
    name: 'categorizeProductsFlow',
    inputSchema: CategorizeProductsInputSchema,
    outputSchema: CategorizeProductsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
