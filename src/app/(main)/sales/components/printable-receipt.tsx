
'use client';

import React from 'react';
import '../printable-receipt.css';
import { PaymentType } from '@/lib/types';
import { BedDouble } from 'lucide-react';


// Define types for props
type SellingFormType = {
    formNumber: string;
    issueDate: string;
    customerName: string;
    customerPhoneNumber?: string;
    creatorName?: string;
    totalPrice: number;
    paymentType: PaymentType;
    deliveryCost?: number;
    discountValue?: number;
    discountType?: 'percentage' | 'cash';
};

type ProductSellingForm = {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

type Payment = {
    amountPaid: number;
};

type CompanyInfo = {
    name: string;
    contact: string;
};

type PrintableReceiptProps = {
    formData: SellingFormType;
    products: ProductSellingForm[];
    payments: Payment[];
    companyInfo: CompanyInfo | null;
};

const paymentTypeTranslations: Record<PaymentType, string> = {
    'Direct Payment': 'پارەی ڕاستەوخۆ',
    'After Delivery': 'دوای گەیاندن',
    'Installments': 'قیست',
    'Pre-order': 'داواکاری پێشوەختە',
};


export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({ formData, products, payments, companyInfo }, ref) => {
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    
    const subTotal = products.reduce((acc, item) => acc + item.lineTotal, 0);
    const discountAmount = (() => {
        if (!formData.discountType || !formData.discountValue) return 0;
        if (formData.discountType === 'percentage') {
            return (subTotal * formData.discountValue) / 100;
        }
        return formData.discountValue;
    })();
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
    const remainingBalance = Math.max(0, formData.totalPrice - totalPaid);

    return (
        <div ref={ref} className="receipt-container">
            <header className="receipt-header">
                 <div className="company-logo">
                   <BedDouble className="inline-block h-10 w-10 text-primary" />
                </div>
                <div className="company-details">
                    <h2>{companyInfo?.name || 'BedArt Group'}</h2>
                    <p>{companyInfo?.contact || 'تەختی نوستن . دۆشەک . پشتی\n07708171818 - 07700771818'}</p>
                </div>
            </header>

            <main>
                <h1 className="receipt-title">پسوولەی پارەدان / Payment Receipt</h1>

                <section className="receipt-info">
                    <div>
                        <p><strong>ژمارەی پسوولە:</strong> {formData.formNumber}</p>
                        <p><strong>بەروار:</strong> {formData.issueDate}</p>
                         <p><strong>فرۆشیار:</strong> {formData.creatorName || 'نەزانراو'}</p>
                    </div>
                    <div>
                        <p><strong>کڕیار:</strong> {formData.customerName}</p>
                        <p><strong>ژ. مۆبایل:</strong> {formData.customerPhoneNumber || 'نەزانراو'}</p>
                    </div>
                </section>

                <table className="line-items-table">
                    <thead>
                        <tr>
                            <th>کاڵا / Item</th>
                            <th>دانە / Qty</th>
                            <th>نرخ / Unit Price</th>
                            <th>کۆی گشتی / Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td>{item.quantity}</td>
                                <td>{currencyFormatter.format(item.unitPrice)}</td>
                                <td>{currencyFormatter.format(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <section className="totals-section">
                    <div>
                        <span>کۆی کاڵاکان / Subtotal:</span>
                        <span>{currencyFormatter.format(subTotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                         <div>
                            <span>داشکاندن / Discount:</span>
                            <span className='text-destructive'>-{currencyFormatter.format(discountAmount)}</span>
                        </div>
                    )}
                    {formData.deliveryCost && formData.deliveryCost > 0 && (
                         <div>
                            <span>گەیاندن / Delivery:</span>
                            <span>{currencyFormatter.format(formData.deliveryCost)}</span>
                        </div>
                    )}
                    <div className="total-amount">
                        <span>کۆی گشتی / Total Amount:</span>
                        <span>{currencyFormatter.format(formData.totalPrice)}</span>
                    </div>
                     <div>
                        <span>بڕی دراو / Paid Amount:</span>
                        <span className='text-green-600'>{currencyFormatter.format(totalPaid)}</span>
                    </div>
                     <div className='font-bold text-lg text-red-600'>
                        <span>بڕی ماوە / Remaining Balance:</span>
                        <span>{currencyFormatter.format(remainingBalance)}</span>
                    </div>
                </section>

                <footer className="receipt-footer">
                    <div>
                        <strong>شێوازی پارەدان / Payment Method:</strong> {paymentTypeTranslations[formData.paymentType] || formData.paymentType}
                    </div>
                    <div className="signature-line">
                        واژۆی ڕێپێدراو / Authorized Signature
                    </div>
                    <p className="thank-you-message">سوپاس بۆ مامەڵەکردن لەگەڵمان</p>
                </footer>
            </main>
        </div>
    );
});

PrintableReceipt.displayName = "PrintableReceipt";
