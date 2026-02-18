'use client';

import React, { useEffect } from 'react';
import '../printable-receipt.css';
import { PaymentType } from '@/lib/types';


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
        <div ref={ref} className="receipt-container p-8">
            <header className="receipt-header">
                <div>
                    {/* Placeholder for logo */}
                </div>
                <div className="company-details text-right">
                    <h2 className="text-2xl font-bold">{companyInfo?.name || 'BedArt Group'}</h2>
                    <p className="whitespace-pre-line">{companyInfo?.contact || 'تەختی نوستن . دۆشەک . پشتی\n07708171818 - 07700771818'}</p>
                </div>
            </header>

            <main>
                <h1 className="receipt-title">PAYMENT RECEIPT / پسوولەی پارەدان</h1>

                <section className="receipt-info">
                    <div>
                        <p><strong>Receipt No:</strong> {formData.formNumber}</p>
                        <p><strong>Date:</strong> {formData.issueDate}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Customer:</strong> {formData.customerName}</p>
                        <p><strong>Phone:</strong> {formData.customerPhoneNumber || 'N/A'}</p>
                        <p><strong>Sales Rep:</strong> {formData.creatorName || 'N/A'}</p>
                    </div>
                </section>

                <hr className="my-4 border-black" />

                <table className="line-items-table">
                    <thead>
                        <tr>
                            <th className="text-right">Item / کاڵا</th>
                            <th>Description / تێبینی</th>
                            <th>Qty / دانە</th>
                            <th>Unit Price / نرخ</th>
                            <th>Subtotal / کۆی گشتی</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td></td>
                                <td>{item.quantity}</td>
                                <td>{currencyFormatter.format(item.unitPrice)}</td>
                                <td>{currencyFormatter.format(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <section className="totals-section">
                    <div>
                        <span>Subtotal / کۆی کاڵاکان:</span>
                        <span>{currencyFormatter.format(subTotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                         <div>
                            <span>Discount / داشکاندن:</span>
                            <span>-{currencyFormatter.format(discountAmount)}</span>
                        </div>
                    )}
                    {formData.deliveryCost && formData.deliveryCost > 0 && (
                         <div>
                            <span>Delivery / گەیاندن:</span>
                            <span>{currencyFormatter.format(formData.deliveryCost)}</span>
                        </div>
                    )}
                    <div className="total-amount">
                        <span>Total Amount / کۆی گشتی:</span>
                        <span>{currencyFormatter.format(formData.totalPrice)}</span>
                    </div>
                     <div>
                        <span>Paid Amount / بڕی دراو:</span>
                        <span>{currencyFormatter.format(totalPaid)}</span>
                    </div>
                     <div>
                        <span>Remaining Balance / بڕی ماوە:</span>
                        <span>{currencyFormatter.format(remainingBalance)}</span>
                    </div>
                </section>

                <footer className="receipt-footer">
                    <div>
                        <strong>Payment Method / شێوازی پارەدان:</strong> {paymentTypeTranslations[formData.paymentType] || formData.paymentType}
                    </div>
                    <div className="signature-line">
                        Authorized Signature / واژۆی ڕێپێدراو
                    </div>
                    <p className="thank-you-message">سوپاس بۆ مامەڵەکردن لەگەڵمان</p>
                </footer>
            </main>
        </div>
    );
});

PrintableReceipt.displayName = "PrintableReceipt";
