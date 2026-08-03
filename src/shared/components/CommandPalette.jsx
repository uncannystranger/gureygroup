import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Package, ShoppingCart, Truck, Users, Settings, Warehouse, FileText } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function CommandPalette({ isOpen, onClose, setActiveTab }) {
  const [query, setQuery] = useState('');
  const { products } = useMultiTenant();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultActions = [
    { id: 'dashboard', title: t('nav.dashboard', 'Dashboard Overview'), category: 'Navigation', icon: Package },
    { id: 'sales', title: t('pos.title', 'Launch POS Terminal (Create Sale)'), category: 'Action', icon: ShoppingCart },
    { id: 'products', title: t('nav.products', 'Products & Inventory Catalog'), category: 'Navigation', icon: Package },
    { id: 'reports', title: t('nav.reports', 'Financial & Sales Reports'), category: 'Navigation', icon: FileText },
    { id: 'users', title: t('nav.employees', 'User & Employee Directory'), category: 'Navigation', icon: Users },
    { id: 'settings', title: t('nav.settings', 'System & Store Settings'), category: 'Navigation', icon: Settings },
  ];

  const productMatches = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()));
  const actionMatches = defaultActions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-4 shadow-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 overflow-hidden animate-fade-scale">
        
        {/* Search Bar Input */}
        <div className="flex items-center px-3 py-2 border-b border-slate-200/60 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search_placeholder', 'Search catalog, orders...')}
            className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Action & Result List */}
        <div className="mt-3 max-h-72 overflow-y-auto space-y-1 pr-1">
          
          {query.length > 0 && productMatches.length > 0 && (
            <div className="px-2 py-1 text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">
              {t('common.search_products', 'Product Matches')} ({productMatches.length})
            </div>
          )}

          {query.length > 0 && productMatches.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelect('products')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition-all btn-micro"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h4>
                <span className="text-[10px] font-semibold text-slate-400">SKU: {p.sku} • ${p.sellingPrice}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}

          <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            {t('dashboard.quick_actions', 'Quick Actions & Navigation')}
          </div>

          {actionMatches.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-left transition-all group btn-micro"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {item.category}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}

        </div>

      </div>
    </div>
  );
}
