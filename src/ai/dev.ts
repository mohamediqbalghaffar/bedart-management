'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/smart-sales-suggestions.ts';
import '@/ai/flows/analyze-purchase-excel.ts';
import '@/ai/flows/analyze-sql-export.ts';
import '@/ai/flows/categorize-products.ts';
