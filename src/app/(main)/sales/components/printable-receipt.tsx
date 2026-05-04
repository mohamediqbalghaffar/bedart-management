'use client';

import React from 'react';
import '../printable-receipt.css';
import { PaymentType } from '@/lib/types';
import { Phone, MapPin, Calendar, User } from 'lucide-react';

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
    
    // Recalculate accurately for the display
    const subTotal = products.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const dVal = Number(formData.discountValue || 0);
    const discountAmount = (() => {
        if (!formData.discountType || dVal === 0) return 0;
        if (formData.discountType === 'percentage') {
            return (subTotal * dVal) / 100;
        }
        return dVal;
    })();
    const delivery = Number(formData.deliveryCost || 0);
    const calculatedTotal = subTotal - discountAmount + delivery;

    const totalPaid = payments?.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0) || 0;
    const calculatedRemaining = Math.max(0, calculatedTotal - totalPaid);
    const overpayment = Math.max(0, totalPaid - calculatedTotal);

    // Standard row count for A4 to keep the footer at the bottom
    const minRows = 10;
    const emptyRowsCount = Math.max(0, minRows - products.length);

    return (
        <div ref={ref} className="new-receipt-container" dir="rtl">
            <header className="new-receipt-header">
                <div className="header-left">
                    <div className="logo-text">
                        <span className="logo-bed">Bed</span><span className="logo-art">Art</span> <span className="logo-group">group</span>
                    </div>
                    <div className="form-number-box">
                        <p className="form-number">No. {String(formData?.formNumber || '0')}</p>
                    </div>
                    <p className="product-categories">تەختی نوستن . دۆشەک . پشتی</p>
                </div>
                <div className="header-right">
                    <div className="phone-numbers">
                        <p>0770 817 1818</p>
                        <p>0770 077 1818</p>
                    </div>
                     <p className="slogan">بە ئارامی بنوو، بە دڵخۆشی لە خەو هەستە.</p>
                </div>
            </header>

            <main className="flex-grow flex flex-col">
                <section className="customer-info">
                    <div className="info-line">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="info-label">بەڕێز:</span>
                        <span className="info-value">{formData.customerName}</span>
                    </div>
                    <div className="info-line">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="info-label">مۆبایل:</span>
                        <span className="info-value">{formData.customerPhoneNumber || ''}</span>
                    </div>
                    <div className="info-line full-width">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="info-label">ناونیشان:</span>
                         <span className="info-value">{formData.customerAddress || ''}</span>
                    </div>
                    <div className="info-line">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
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
                                <td className="font-bold">
                                    <span dir="rtl" style={{ unicodeBidi: 'embed' }}>{item.productName}</span>
                                </td>
                                <td className="text-center font-bold">{item.quantity}</td>
                                <td className="text-center">{currencyFormatter.format(item.unitPrice)}</td>
                                <td className="text-center font-bold">{currencyFormatter.format(Number(item.quantity) * Number(item.unitPrice))}</td>
                            </tr>
                        ))}
                        {Array.from({ length: emptyRowsCount }).map((_, index) => (
                             <tr key={`empty-${index}`} className="empty-row">
                                <td>&nbsp;</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="flex-grow"></div>
                
                <footer className="new-receipt-footer">
                    <div className="signature-area">
                         <div className="signature">
                            <p>واژۆ</p>
                        </div>
                    </div>
                    <div className="totals-summary">
                        <div className="summary-line">
                            <span className="summary-label">کۆی کاڵاکان:</span>
                            <span className="summary-value">{currencyFormatter.format(subTotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="summary-line discount">
                                <span className="summary-label">داشکاندن:</span>
                                <span className="summary-value">-{currencyFormatter.format(discountAmount)}</span>
                            </div>
                        )}
                        {delivery > 0 && (
                            <div className="summary-line">
                                <span className="summary-label">تێچووی گەیاندن:</span>
                                <span className="summary-value">{currencyFormatter.format(delivery)}</span>
                            </div>
                        )}
                        <div className="total-line">
                            <span>کۆی گشتی (USD):</span>
                            <span>{currencyFormatter.format(calculatedTotal)}</span>
                        </div>
                        {(formData.paymentType === 'Installments' || (payments && payments.length > 0)) && (
                            <>
                                <div className="summary-line mt-2 text-green-700 font-semibold text-lg">
                                    <span className="summary-label">کۆی دراوە:</span>
                                    <span className="summary-value">{currencyFormatter.format(totalPaid)}</span>
                                </div>
                                <div className="summary-line text-red-600 font-bold text-lg">
                                    <span className="summary-label">ماوە:</span>
                                    <span className="summary-value">{currencyFormatter.format(calculatedRemaining)}</span>
                                </div>
                                {overpayment > 0 && (
                                    <div className="summary-line text-green-600 font-bold text-lg">
                                        <span className="summary-label">بڕی زیادە:</span>
                                        <span className="summary-value">{currencyFormatter.format(overpayment)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </footer>
            </main>
        </div>
    );
});

PrintableReceipt.displayName = "PrintableReceipt";
