
export type SaleStatus = 'Fully Paid' | 'Unpaid' | 'Partially Paid';
export type PaymentType = 'After Delivery' | 'Installments' | 'Pre-order' | 'Direct Payment';
export type PaymentMethod = 'Cash' | 'Transfer';
export type StockLocation = 'Warehouse' | 'Shop Showroom';
export type ExpenseCategory = 'Daily' | 'Salary' | 'Rent' | 'Electricity' | 'Transport' | 'Other';
export type ProductCategory = 'Mattress' | 'Bed' | 'Pillow' | 'Cover';

export type Payment = {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  note?: string;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type Sale = {
  id: string;
  customerName: string;
  date: string;
  amount: number;
  status: SaleStatus;
  items: SaleItem[];
};

export type Product = {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: ProductCategory;
  location: StockLocation;
  lowStockThreshold: number;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
};

export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy: PaymentMethod;
};
