
'use server';
/**
 * @fileOverview An AI agent for analyzing generic data from exported CSV files.
 *
 * - analyzeSqlExport - A function that parses a CSV file and extracts structured data.
 * - SqlExportInput - The input type for the analyzeSqlExport function.
 * - SqlExportOutput - The return type for the analyzeSqlExport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SqlExportInputSchema = z.object({
  csvData: z.string().describe("A CSV string exported from a user's database."),
});
export type SqlExportInput = z.infer<typeof SqlExportInputSchema>;

// Schemas for data types we can import
const ProductImportSchema = z.object({
  productName: z.string().describe("Name of the product."),
  category: z.enum(['Mattress', 'Bed', 'Pillow', 'Cover']).describe("Category of the product."),
  sizeModel: z.string().optional().describe("Size or model of the product."),
  stockLocation: z.enum(['Warehouse', 'Shop Showroom']).describe("Stock location, default to 'Warehouse' if not specified."),
  currentQuantity: z.coerce.number().describe("Current quantity in stock."),
  sellingPrice: z.coerce.number().optional().describe("The price at which the product is sold."),
  unitPrice: z.coerce.number().optional().describe("The price at which the product was purchased."),
});

const CustomerImportSchema = z.object({
  customerName: z.string().describe("The name of the customer."),
  customerPhoneNumber: z.string().optional().describe("The customer's phone number."),
  customerAddress: z.string().optional().describe("The customer's address."),
});

const SupplierImportSchema = z.object({
    supplierName: z.string().describe("Name of the supplier."),
    contactInformation: z.string().optional().describe("Supplier contact information (phone, address, etc.)."),
});

const SqlExportOutputSchema = z.object({
    dataType: z.enum(['products', 'customers', 'suppliers', 'unknown']).describe("The type of data identified in the CSV."),
    products: z.array(ProductImportSchema).optional().describe("Populate this array if the data is determined to be products."),
    customers: z.array(CustomerImportSchema).optional().describe("Populate this array if the data is determined to be customers."),
    suppliers: z.array(SupplierImportSchema).optional().describe("Populate this array if the data is determined to be suppliers."),
}).describe("The output will be an object containing the identified 'dataType' and ONLY ONE of the following arrays: 'products', 'customers', or 'suppliers', based on that type.");


export type SqlExportOutput = z.infer<typeof SqlExportOutputSchema>;

export async function analyzeSqlExport(input: SqlExportInput): Promise<SqlExportOutput> {
  return analyzeSqlExportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSqlExportPrompt',
  input: {schema: SqlExportInputSchema},
  output: {schema: SqlExportOutputSchema},
  prompt: `You are an expert data migration assistant for a CRM.
Your task is to analyze the provided CSV data, determine what kind of data it represents, and then extract it into a structured format.

The data can be one of three types: 'products', 'customers', or 'suppliers'.

Your tasks are:
1.  **Analyze the CSV**: Look at the column names (which could be in any language) and the data to figure out if you're looking at products, customers, or suppliers.
2.  **Set 'dataType'**: You MUST set the \`dataType\` field in the output to one of 'products', 'customers', or 'suppliers'. If you cannot confidently determine the type, set it to 'unknown'.
3.  **Populate ONE Array**: Based on the \`dataType\` you identified, you MUST populate ONLY the corresponding array in the output object (\`products\`, \`customers\`, or \`suppliers\`). The other two arrays MUST be left empty or undefined. Do not populate multiple arrays.
4.  **Map Data**: For each row in the CSV, extract the relevant data and map it to the fields defined in the corresponding schema.
    *   For **products**, you must identify columns for at least 'productName', 'category', 'currentQuantity', and 'stockLocation'. If 'stockLocation' isn't present, default it to 'Warehouse'. Categories must be one of: 'Mattress', 'Bed', 'Pillow', 'Cover'.
    *   For **customers**, you must identify a column for 'customerName'. 'customerPhoneNumber' and 'customerAddress' are optional.
    *   For **suppliers**, you must identify a column for 'supplierName'. 'contactInformation' is optional.
5.  **Filter Rows**: Ignore any header rows, empty rows, or rows that contain totals or summaries.
6.  **Return Valid JSON**: The final output must be a single JSON object that strictly matches the 'SqlExportOutputSchema'. It must contain the 'dataType' and only ONE of the data arrays.

CSV Data:
{{{csvData}}}`,
});

const analyzeSqlExportFlow = ai.defineFlow(
  {
    name: 'analyzeSqlExportFlow',
    inputSchema: SqlExportInputSchema,
    outputSchema: SqlExportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
