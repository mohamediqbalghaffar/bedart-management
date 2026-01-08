'use server';

/**
 * @fileOverview A smart suggestion AI agent for sales suggestions.
 *
 * - getSmartSalesSuggestions - A function that retrieves smart sales suggestions based on historical data.
 * - SmartSalesSuggestionInput - The input type for the getSmartSalesSuggestions function.
 * - SmartSalesSuggestionOutput - The return type for the getSmartSalesSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSalesSuggestionInputSchema = z.object({
  searchTerm: z.string().describe('The search term for product, quantity, or customer suggestions.'),
  context: z.string().optional().describe('Additional context for the suggestions, such as recent orders or trends.'),
});
export type SmartSalesSuggestionInput = z.infer<typeof SmartSalesSuggestionInputSchema>;

const SmartSalesSuggestionOutputSchema = z.array(
  z.object({
    suggestion: z.string().describe('The suggested product, quantity, or customer.'),
    confidence: z.number().describe('The confidence level of the suggestion (0-1).'),
    reason: z.string().describe('The reason for the suggestion.'),
  })
);
export type SmartSalesSuggestionOutput = z.infer<typeof SmartSalesSuggestionOutputSchema>;

export async function getSmartSalesSuggestions(input: SmartSalesSuggestionInput): Promise<SmartSalesSuggestionOutput> {
  return smartSalesSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSalesSuggestionPrompt',
  input: {schema: SmartSalesSuggestionInputSchema},
  output: {schema: SmartSalesSuggestionOutputSchema},
  prompt: `You are an AI assistant that provides smart suggestions for products, quantities, or customers based on historical trends and data for salespersons.

  Given the following search term and context, provide a list of suggestions with a confidence level (0-1) and a reason for each suggestion.

  Search Term: {{{searchTerm}}}
  Context: {{{context}}}

  Format your output as a JSON array of objects, where each object has a suggestion, confidence, and reason field.  The confidence level should be between 0 and 1.

  Example:
  [
    {
      "suggestion": "Product A",
      "confidence": 0.85,
      "reason": "Product A has been frequently purchased with the current product in recent orders."
    },
    {
      "suggestion": "Quantity: 10",
      "confidence": 0.70,
      "reason": "The average quantity for this product in similar orders is 10."
    },
    {
      "suggestion": "Customer B",
      "confidence": 0.60,
      "reason": "Customer B has a history of purchasing similar products."
    }
  ]
  `,
});

const smartSalesSuggestionFlow = ai.defineFlow(
  {
    name: 'smartSalesSuggestionFlow',
    inputSchema: SmartSalesSuggestionInputSchema,
    outputSchema: SmartSalesSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
