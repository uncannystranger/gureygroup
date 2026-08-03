import React, { useState } from 'react';
import { X, Boxes, Plus, Minus } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function StockAdjustmentModal({ isOpen, onClose, product }) {
  const { logStockAdjustment, updateProduct } = useMultiTenant();
  const { t } = useLanguage();

  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState('Supplier Restock');

  if (!isOpen || !product) return null;

  const reasons = [
    'Supplier Restock',
    'Inventory Audit Variance',
    'Damaged Stock Write-off',
    'Expired Product Clearance',
    'Tester Unit Allocation',
    'Customer Return Restock'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const delta = adjustmentType === 'add' ? Number(quantity) : -Number(quantity);
    const newQty = Math.max(0, product.quantity + delta);

    updateProduct(product.id, { quantity: newQty });
    logStockAdjustment(product.id, product.name, product.sku, delta, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-4xl p-6 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 space-y-4 animate-fade-scale">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors btn-micro"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{t('products.adjust_stock', 'Stock Adjustment')}</h3>
            <p className="text-xs font-semibold text-slate-500 truncate max-w-[260px]">{product.name} (Current: {product.quantity} {product.unit})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs font-semibold">
          
          {/* Add or Subtract Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setAdjustmentType('add')}
              className={`py-2 rounded-xl font-extrabold flex items-center justify-center space-x-1 transition-all btn-micro ${
                adjustmentType === 'add' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Stock Intake (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('subtract')}
              className={`py-2 rounded-xl font-extrabold flex items-center justify-center space-x-1 transition-all btn-micro ${
                adjustmentType === 'subtract' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              <Minus className="w-4 h-4" />
              <span>Write-off (-)</span>
            </button>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('common.quantity', 'Quantity Units')}</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Adjustment Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
            >
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
            Updated Stock Level will be <span className="font-extrabold text-slate-900 dark:text-white">{Math.max(0, product.quantity + (adjustmentType === 'add' ? Number(quantity) : -Number(quantity)))} {product.unit}</span>.
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold btn-micro"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black shadow-md hover:scale-105 transition-all btn-micro"
            >
              {t('common.save', 'Save Adjustment')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
