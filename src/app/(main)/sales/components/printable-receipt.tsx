'use client';

import React from 'react';
import '../printable-receipt.css';
import { PaymentType } from '@/lib/types';


// Define types for props
type SellingFormType = {
    formNumber: string;
    issueDate: string;
    customerName: string;
    customerPhoneNumber?: string;
    customerAddress?: string;
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


export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({ formData, products, payments, companyInfo }, ref) => {
    
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    
    // Increased minRows to 20 to fill the A4 page height more nicely
    const minRows = 20;
    const emptyRows = Math.max(0, minRows - products.length);

    return (
        <div ref={ref} className="new-receipt-container" dir="rtl">
            <header className="new-receipt-header">
                <div className="header-left">
                    <div className="logo-text">
                        <span className="logo-bed">Bed</span><span className="logo-art">Art</span> <span className="logo-group">group</span>
                    </div>
                    <p className="form-number">No. {formData.formNumber}</p>
                    <p className="product-categories">تەختی نوستن . دۆشەک . پشتی</p>
                </div>
                <div className="header-right">
                    <div className="phone-numbers">
                        <p>&#x1F4DE; 0770 817 1818</p>
                        <p>&#x1F4DE; 0770 077 1818</p>
                    </div>
                     <p className="slogan">بە ئارامی بنوو، بە دڵخۆشی لە خەو هەستە.</p>
                </div>
            </header>

            <main className="new-receipt-main flex-grow flex flex-col">
                <section className="customer-info">
                    <div className="info-line">
                        <span className="info-label">بەڕێز:</span>
                        <span className="info-value">{formData.customerName}</span>
                    </div>
                    <div className="info-line">
                        <span className="info-label">ژ.مۆبایل:</span>
                        <span className="info-value">{formData.customerPhoneNumber || '.........................'}</span>
                    </div>
                     <div className="info-line full-width">
                        <span className="info-label">ناونیشان:</span>
                         <span className="info-value">{formData.customerAddress || '................................................................'}</span>
                    </div>
                    <div className="info-line">
                        <span className="info-label">بەروار:</span>
                        <span className="info-value">{formData.issueDate}</span>
                    </div>
                </section>

                <table className="new-line-items-table">
                    <thead>
                        <tr>
                            <th className="item-col">بابەت</th>
                            <th className="qty-col">دانە</th>
                            <th className="price-col">نرخی تاک</th>
                            <th className="total-col">نرخی کۆ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-center">{currencyFormatter.format(item.unitPrice)}</td>
                                <td className="text-center">{currencyFormatter.format(item.lineTotal)}</td>
                            </tr>
                        ))}
                        {Array.from({ length: emptyRows }).map((_, index) => (
                             <tr key={`empty-${index}`} className="empty-row">
                                <td>&nbsp;</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <footer className="new-receipt-footer">
                    <div className="notes-and-signature">
                         <div className="signature">
                            <p>واژۆ</p>
                        </div>
                    </div>
                    <div className="totals-summary">
                        <div className="total-line">
                            <span>کۆی گشتی:</span>
                            <span className="font-bold">{currencyFormatter.format(formData.totalPrice)}</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
});

PrintableReceipt.displayName = "PrintableReceipt";