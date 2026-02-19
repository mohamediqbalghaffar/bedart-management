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

const SqlExportOutputSchema = z.discriminatedUnion("dataType", [
  z.object({ dataType: z.literal('products'), records: z.array(ProductImportSchema) }),
  z.object({ dataType: z.literal('customers'), records: z.array(CustomerImportSchema) }),
  z.object({ dataType: z.literal('suppliers'), records: z.array(SupplierImportSchema) }),
]);

export type SqlExportOutput = z.infer<typeof SqlExportOutputSchema>;

export async function analyzeSqlExport(input: SqlExportInput): Promise<SqlExportOutput> {
  return analyzeSqlExportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSqlExportPrompt',
  input: {schema: SqlExportInputSchema},
  output: {schema: SqlExportOutputSchema},
  prompt: `You are an expert data migration assistant for a CRM.
Your task is to analyze the provided CSV data and determine what kind of data it represents and then extract it into a structured format.

The data can be one of the following types: 'products', 'customers', or 'suppliers'.

Your tasks are:
1.  **Analyze the CSV Header and Rows**: Look at the column names (which could be in any language) and the data to figure out if you're looking at products, customers, or suppliers.
2.  **Set the 'dataType'**: Based on your analysis, set the 'dataType' field in the output to 'products', 'customers', or 'suppliers'.
3.  **Extract and Map Data**: For each row in the CSV, extract the relevant data and map it to the fields defined in the corresponding output schema.
    *   For **products**, you must identify columns for at least 'productName', 'category', 'currentQuantity', and 'stockLocation'. If 'stockLocation' isn't present, you must default to 'Warehouse' for all records. Categories must be one of: 'Mattress', 'Bed', 'Pillow', 'Cover'.
    *   For **customers**, you must identify a column for 'customerName'. 'customerPhoneNumber' and 'customerAddress' are optional.
    *   For **suppliers**, you must identify a column for 'supplierName'. 'contactInformation' is optional.
4.  **Filter Rows**: Ignore any header rows, empty rows, or rows that contain totals or summaries. Only extract rows that represent individual data records.
5.  **Return Structured Output**: The final output must be a single JSON object matching the 'SqlExportOutputSchema'.

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
