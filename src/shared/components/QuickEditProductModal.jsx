import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function QuickEditProductModal({ isOpen, onClose, product }) {
  const { updateProduct } = useMultiTenant();
  const { t } = useLanguage();

  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setCostPrice(product.costPrice || '');
      setSellingPrice(product.sellingPrice || '');
      setQuantity(product.quantity || '');
      setLowStockLevel(product.lowStockLevel || '');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProduct(product.id, {
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        quantity: parseInt(quantity, 10),
        lowStockLevel: parseInt(lowStockLevel, 10)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
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
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{t('products.quick_edit', 'Quick Edit Product')}</h3>
            <p className="text-xs font-semibold text-slate-500 truncate max-w-[260px]">{product.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('products.cost', 'Cost Price')} ($)</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('products.price', 'Selling Price')} ($)</label>
              <input
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('products.stock_quantity', 'Stock Quantity')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">{t('products.low_stock_level', 'Low Stock Alert')}</label>
              <input
                type="number"
                value={lowStockLevel}
                onChange={(e) => setLowStockLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold btn-micro"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black shadow-md hover:scale-105 transition-all flex items-center space-x-1.5 btn-micro"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : t('common.save', 'Save Changes')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
