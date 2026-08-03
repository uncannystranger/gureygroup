import React from 'react';
import { Printer, X } from 'lucide-react';
import { useLanguage } from '../../localization/LanguageContext';

export default function ReceiptModal({ isOpen, onClose, sale }) {
  const { t, formatDate } = useLanguage();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-4xl p-6 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white dark:bg-slate-900 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-scale">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors btn-micro"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Printable Receipt Paper layout */}
        <div id="printable-receipt" className="bg-amber-50/60 dark:bg-slate-950 p-5 rounded-3xl border border-amber-200/80 dark:border-slate-800 font-mono text-xs space-y-3 text-slate-800 dark:text-slate-200 shadow-inner">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 dark:text-white">Gurey Group</h2>
            <p className="text-[10px] text-slate-500">SoHo Flagship Store • NY 10012</p>
            <p className="text-[10px] text-slate-500">TEL: +1 (212) 555-0192</p>
            <div className="pt-1 text-[10px] font-bold text-indigo-500">{t('pos.receipt_preview', 'RECEIPT')}: {sale.receiptNumber}</div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{t('common.date', 'Date')}: {formatDate(sale.formattedDate || 'Today')}</span>
            <span>Cashier: {sale.employeeName || 'Ahmed'}</span>
          </div>
          <div className="text-[10px] text-slate-500">{t('pos.select_customer', 'Customer')}: {sale.customerName || t('pos.walk_in', 'Walk-in Customer')}</div>

          {/* Line items table */}
          <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            {(sale.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px] animate-fade-in-up">
                <div className="flex-1 pr-2">
                  <p className="font-bold line-clamp-1">{item.productName || item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.quantity} x ${item.price?.toFixed(2)}</p>
                </div>
                <span className="font-extrabold">${(item.quantity * item.price)?.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-500">
              <span>{t('common.subtotal', 'Subtotal')}:</span>
              <span>${sale.subtotal?.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>{t('common.discount', 'Discount')}:</span>
                <span>-${sale.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>{t('common.tax', 'Tax')} (8.5%):</span>
              <span>${sale.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              <span>{t('common.total', 'TOTAL')}:</span>
              <span>${sale.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method & Barcode */}
          <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold">
              {t('status.paid', 'PAID VIA')} {sale.paymentMethod?.toUpperCase()}
            </span>
            <p className="text-[9px] text-slate-400 italic">Thank you for shopping at Gurey Group!</p>
            <div className="w-full text-center font-mono text-[10px] tracking-widest opacity-60">
              ||| | |||| ||| |||| | ||| ||||
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-md hover:scale-105 transition-all flex items-center justify-center space-x-1.5 btn-micro"
          >
            <Printer className="w-4 h-4" />
            <span>{t('common.print', 'Print Thermal Receipt')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
