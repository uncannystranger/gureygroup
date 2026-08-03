import React from 'react';
import { Printer, X, Building2 } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function InvoiceModal({ isOpen, onClose, sale }) {
  const { activeCompany } = useMultiTenant();
  const { t, formatDate } = useLanguage();

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl glass-panel rounded-4xl p-6 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white dark:bg-slate-900 space-y-6 max-h-[90vh] overflow-y-auto animate-fade-scale">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors btn-micro"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Invoice Paper Document */}
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-6">
          
          {/* Invoice Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                {activeCompany?.name || 'Gurey Group HQ'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Commercial Sales & Retail Operations</p>
              <p className="text-xs text-slate-500">TAX ID: US-984019284 • VAT #: 8590123</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-wider">
                COMMERCIAL INVOICE
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-2">
                INV-{sale.receiptNumber?.replace('REC-', '') || '2026-001'}
              </p>
              <p className="text-[11px] text-slate-400">{t('common.date', 'Date')}: {formatDate(sale.formattedDate || 'Today')}</p>
            </div>
          </div>

          {/* Customer & Billed To details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Billed To</span>
              <p className="font-extrabold text-slate-900 dark:text-white">{sale.customerName || t('pos.walk_in', 'Walk-in Customer')}</p>
              <p className="text-slate-500">Retail Client</p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Payment Status</span>
              <p className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">{t('status.paid', sale.paymentStatus || 'PAID IN FULL')}</p>
              <p className="text-slate-500">Via {sale.paymentMethod || 'Card'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase">
                  <th className="pb-2">{t('products.product_name', 'Product Item')}</th>
                  <th className="pb-2 text-center">{t('common.quantity', 'Qty')}</th>
                  <th className="pb-2 text-right">{t('common.unit_price', 'Unit Price')}</th>
                  <th className="pb-2 text-right">{t('common.total', 'Total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx} className="animate-fade-in-up">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{item.productName || item.name}</td>
                    <td className="py-2.5 text-center font-extrabold">{item.quantity}</td>
                    <td className="py-2.5 text-right">${item.price?.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-black text-slate-900 dark:text-white">${(item.quantity * item.price)?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Totals */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-right">
            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
              <span>{t('common.subtotal', 'Subtotal')}:</span>
              <span>${sale.subtotal?.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between font-bold text-rose-500">
                <span>{t('common.discount', 'Discount Applied')}:</span>
                <span>-${sale.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
              <span>{t('common.tax', 'Sales Tax')} ({activeCompany?.taxRate || 8.5}%):</span>
              <span>${sale.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-base pt-2 border-t border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              <span>{t('common.total', 'Total Amount Paid')}:</span>
              <span className="text-indigo-600 dark:text-indigo-400">${sale.total?.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center justify-center space-x-2 btn-micro"
          >
            <Printer className="w-4 h-4" />
            <span>{t('common.print', 'Print Invoice Document')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
