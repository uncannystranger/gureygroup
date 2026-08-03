import React from 'react';
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function HeldCartsModal({ isOpen, onClose, onResumeCart }) {
  const { heldCarts, restoreHeldCart, deleteHeldCart } = useMultiTenant();
  const { t, formatDate } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-4xl p-6 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-scale">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors btn-micro"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{t('pos.held_carts', 'Held POS Carts')}</h3>
            <p className="text-xs font-semibold text-slate-500">{heldCarts.length} cart(s) on hold</p>
          </div>
        </div>

        {heldCarts.length === 0 ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl animate-fade-scale">
            {t('pos.cart_empty_desc', "No active carts on hold. Press 'Hold Cart' on POS terminal to queue an order.")}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {heldCarts.map((h) => {
              const totalAmount = h.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

              return (
                <div key={h.id} className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between space-x-3 animate-fade-in-up">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{h.customerName}</h4>
                    <p className="text-[11px] font-semibold text-slate-400">{h.note} • {formatDate(h.createdAt)}</p>
                    <p className="text-xs font-black text-indigo-500 mt-1">${totalAmount.toFixed(2)} ({h.items.length} items)</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => deleteHeldCart(h.id)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 hover:bg-rose-100 transition-colors btn-micro"
                      title="Discard Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const cartData = restoreHeldCart(h.id);
                        if (cartData) onResumeCart(cartData);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold shadow-sm hover:scale-105 transition-all flex items-center space-x-1 btn-micro"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
