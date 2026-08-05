import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Layers, 
  Boxes, 
  Clock, 
  Archive, 
  Copy, 
  Edit3, 
  ArrowUpDown, 
  CheckSquare, 
  Square, 
  Download,
  RotateCcw,
  DollarSign,
  Truck,
  PackageOpen
} from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import QuickEditProductModal from '../../shared/components/QuickEditProductModal';
import StockAdjustmentModal from '../../shared/components/StockAdjustmentModal';
import ConfirmationModal from '../../shared/components/ConfirmationModal';

function ProductImageWithSkeleton({ src, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-300/60 dark:bg-slate-700/60" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function ProductsScreen({ onOpenAddProduct }) {
  const { 
    products, 
    suppliers, 
    duplicateProduct, 
    archiveProduct, 
    restoreProduct, 
    bulkPriceUpdate, 
    bulkStockUpdate, 
    bulkArchiveProducts,
    stockAdjustments
  } = useMultiTenant();

  const { t, formatDate } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  // Multi-Select Checkboxes state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [quickEditProd, setQuickEditProd] = useState(null);
  const [stockAdjProd, setStockAdjProd] = useState(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);

  // Bulk Price Modal State
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [bulkPriceChange, setBulkPriceChange] = useState(10);

  const categories = ['All', 'Makeup', 'Skincare', 'Fragrance', 'Haircare'];

  // Active Catalog Products
  const activeProducts = products.filter(p => !p.isArchived);
  const archivedProducts = products.filter(p => p.isArchived);

  // Filtering & Sorting
  let filtered = activeSubTab === 'archived' ? archivedProducts : activeProducts;

  filtered = filtered.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.includes(searchTerm);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || 
                          (selectedStatus === 'Low Stock' && p.quantity <= p.lowStockLevel) ||
                          (selectedStatus === 'Out of Stock' && p.quantity === 0) ||
                          (selectedStatus === 'In Stock' && p.quantity > p.lowStockLevel);
    return matchesSearch && matchesCat && matchesStatus;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'stock') return b.quantity - a.quantity;
    if (sortBy === 'margin') return parseFloat(b.profitMargin) - parseFloat(a.profitMargin);
    return 0;
  });

  // Checkbox handlers
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  // Bulk CSV Export
  const handleBulkExportCSV = () => {
    const targetProducts = products.filter(p => selectedIds.includes(p.id));
    const csvRows = [
      ['ID', 'Name', 'SKU', 'Barcode', 'Category', 'Cost Price', 'Selling Price', 'Quantity', 'Status'],
      ...targetProducts.map(p => [p.id, `"${p.name}"`, p.sku, p.barcode, p.category, p.costPrice, p.sellingPrice, p.quantity, p.status])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GureyGroup_Products_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subTabs = [
    { id: 'catalog', labelKey: 'nav.products', defaultLabel: 'Products Catalog', icon: Package },
    { id: 'categories', labelKey: 'products.category', defaultLabel: 'Categories & Brands', icon: Layers },
    { id: 'inventory', labelKey: 'nav.inventory', defaultLabel: 'Stock Adjustments & Audit', icon: Boxes },
    { id: 'expiries', labelKey: 'products.exp_date', defaultLabel: 'Expiries & Clearance', icon: Clock },
    { id: 'suppliers', labelKey: 'dashboard.purchases_po', defaultLabel: 'Suppliers Directory', icon: Truck },
    { id: 'archived', labelKey: 'common.all', defaultLabel: `Archived (${archivedProducts.length})`, icon: Archive },
  ];

  return (
    <div className="space-y-6 pb-12 page-enter">
      
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('products.catalog_title', 'Products Catalog & Inventory')}
          </h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('products.catalog_subtitle', 'Manage products, track batches, low stock alerts and pricing.')}
          </p>
        </div>

        {/* ADD PRODUCT BUTTON (Ctrl + N) */}
        <button 
          onClick={onOpenAddProduct}
          className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 self-start sm:self-auto btn-micro"
        >
          <Plus className="w-4 h-4" />
          <span>{t('products.add_product', 'Add New Product')} (Ctrl+N)</span>
        </button>
      </div>

      {/* Merged Section Sub-Navigation Tabs */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 p-1.5 rounded-2xl glass-panel border border-white/60 dark:border-white/10">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id); setSelectedIds([]); }}
              className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all btn-micro ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{t(tab.labelKey, tab.defaultLabel)}</span>
            </button>
          );
        })}
      </div>

      {/* FLOATING BULK ACTIONS TOOLBAR */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-3xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xl border border-white/20 flex flex-wrap items-center justify-between gap-3 animate-fade-scale z-30">
          <div className="flex items-center space-x-2 text-xs font-black">
            <span className="px-2.5 py-1 rounded-full bg-indigo-500 text-white text-[10px]">
              {selectedIds.length} Selected
            </span>
            <span>Bulk Actions Bar</span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold flex-wrap gap-2">
            <button 
              onClick={() => setIsBulkPriceOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/20 dark:bg-slate-200 hover:bg-white/30 transition-colors flex items-center space-x-1 btn-micro"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Update Prices</span>
            </button>

            <button 
              onClick={() => bulkStockUpdate(selectedIds, 10, 'Bulk Stock Intake')}
              className="px-3 py-1.5 rounded-xl bg-white/20 dark:bg-slate-200 hover:bg-white/30 transition-colors flex items-center space-x-1 btn-micro"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>+10 Stock</span>
            </button>

            <button 
              onClick={() => bulkArchiveProducts(selectedIds)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/80 hover:bg-amber-600 text-white transition-colors flex items-center space-x-1 btn-micro"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Selected</span>
            </button>

            <button 
              onClick={handleBulkExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center space-x-1 btn-micro"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button 
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white btn-micro"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Sub-Tab 1: Products Catalog & Archived */}
      {(activeSubTab === 'catalog' || activeSubTab === 'archived') && (
        <div className="space-y-6">
          
          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl glass-panel border border-white/60 dark:border-white/10">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('products.search_placeholder', 'Search by product name, SKU, or barcode...')}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all focus:border-indigo-500"
              />
            </div>

            {/* Select All Toggle & Sort By */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 btn-micro"
              >
                {selectedIds.length === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All ({filtered.length})</span>
              </button>

              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none"
                >
                  <option value="name">Sort: Name</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="stock">Stock Quantity</option>
                  <option value="margin">Profit Margin %</option>
                </select>
              </div>

              {/* Category Chips */}
              <div className="flex items-center space-x-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-micro ${
                      selectedCategory === cat
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Empty State / Product Cards Grid */}
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-8 rounded-4xl glass-panel border border-dashed border-slate-300 dark:border-slate-700 space-y-4 animate-fade-scale">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center shadow-inner">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t('products.empty_title', 'No products have been added yet.')}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t('products.empty_desc', 'Create your first product to start managing your inventory and tracking sales.')}
                </p>
              </div>
              <button
                onClick={onOpenAddProduct}
                className="px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2 btn-micro"
              >
                <Plus className="w-4 h-4" />
                <span>{t('products.empty_button', 'Add Product')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((prod) => {
                const isSelected = selectedIds.includes(prod.id);
                const statusKey = prod.quantity === 0 
                  ? 'status.out_of_stock' 
                  : (prod.quantity <= prod.lowStockLevel ? 'status.low_stock' : 'status.in_stock');
                
                const localizedStatus = t(statusKey, prod.status);

                return (
                  <div 
                    key={prod.id} 
                    className={`glass-panel rounded-4xl p-6 relative flex flex-col justify-between group card-hover-lift animate-fade-in-up ${
                      isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div>
                      {/* Checkbox Selector overlay */}
                      <button
                        onClick={() => toggleSelect(prod.id)}
                        className="absolute top-4 left-4 z-20 p-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-indigo-500 hover:scale-110 transition-transform btn-micro"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 fill-current" /> : <Square className="w-4 h-4" />}
                      </button>

                      <div className="relative h-44 rounded-3xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                        <ProductImageWithSkeleton 
                          src={prod.images[0]} 
                          alt={prod.name} 
                        />
                        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          prod.quantity === 0 
                            ? 'bg-rose-500 text-white' 
                            : (prod.quantity <= prod.lowStockLevel ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white')
                        }`}>
                          {localizedStatus}
                        </span>
                        <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white">
                          {prod.category}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        SKU: {prod.sku} • Barcode: {prod.barcode}
                      </p>

                      <div className="mt-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400">{t('products.price', 'Selling Price')}</span>
                          <p className="text-base font-black text-slate-900 dark:text-white">${prod.sellingPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400">{t('products.profit', 'Profit Margin')}</span>
                          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">+{prod.profitMargin}%</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{t('products.stock_quantity', 'Stock Quantity')}:</span>
                        <span className={prod.quantity <= prod.lowStockLevel ? 'text-amber-500 font-black' : ''}>
                          {prod.quantity} {prod.unit}
                        </span>
                      </div>
                    </div>

                    {/* Commercial Micro-Actions Row */}
                    <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs gap-1">
                      
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => setQuickEditProd(prod)}
                          className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-500 hover:text-white transition-colors btn-micro"
                          title="Quick Edit Price & Stock"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => duplicateProduct(prod.id)}
                          className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-500 hover:text-white transition-colors btn-micro"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => setStockAdjProd(prod)}
                          className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-500 hover:text-white transition-colors btn-micro"
                          title="Log Stock Intake / Write-off"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                        </button>

                        {prod.isArchived ? (
                          <button 
                            onClick={() => restoreProduct(prod.id)}
                            className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors btn-micro"
                            title="Restore Product"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setConfirmArchiveId(prod.id)}
                            className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white transition-colors btn-micro"
                            title="Archive Product"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-slate-400">Exp: {formatDate(prod.expiryDate)}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Sub-Tab 2: Categories & Brands */}
      {activeSubTab === 'categories' && (
        <div className="glass-panel rounded-4xl p-6 space-y-6 card-hover-lift">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Cosmetics Classification & Brand Portfolios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['Makeup', 'Skincare', 'Fragrance', 'Haircare'].map((cat) => {
              const catProds = products.filter(p => !p.isArchived && p.category === cat);
              const catStockVal = catProds.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0);

              return (
                <div key={cat} className="p-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 card-hover-lift">
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-wider">{cat}</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {catProds.length} Active SKUs
                  </p>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">${catStockVal.toFixed(2)} Inventory Value</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Stock Adjustments & Audit History Timeline */}
      {activeSubTab === 'inventory' && (
        <div className="glass-panel rounded-4xl p-6 space-y-6 card-hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Stock Adjustment Audit Log</h3>
              <p className="text-xs font-medium text-slate-500">Real-time track of inventory intake, write-offs, and sales deductions</p>
            </div>
          </div>

          <div className="space-y-3">
            {stockAdjustments.map((adj) => (
              <div key={adj.id} className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs animate-fade-in-up">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{adj.productName} ({adj.sku})</h4>
                  <p className="text-[11px] font-semibold text-slate-400">Reason: {adj.reason} • By: {adj.user}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    adj.delta > 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {adj.delta > 0 ? `+${adj.delta}` : adj.delta} units
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">{formatDate(adj.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Expiries & Clearance */}
      {activeSubTab === 'expiries' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Cosmetics Expiration Dates & Clearance Alert</h3>
          <div className="responsive-table-wrapper">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase">
                  <th className="pb-3">{t('products.product_name', 'Product Name')}</th>
                  <th className="pb-3">{t('products.batch_no', 'Batch #')}</th>
                  <th className="pb-3">{t('products.exp_date', 'Expiry Date')}</th>
                  <th className="pb-3">{t('products.stock_quantity', 'Stock Units')}</th>
                  <th className="pb-3 text-right">{t('common.actions', 'Clearance Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60">
                {products.filter(p => !p.isArchived).map((p) => (
                  <tr key={p.id} className="animate-fade-in-up hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3 font-mono text-slate-400">{p.batchNumber}</td>
                    <td className="py-3 font-extrabold text-rose-500">{formatDate(p.expiryDate)}</td>
                    <td className="py-3">{p.quantity} {p.unit}</td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => alert(`Marked ${p.name} for clearance promotion.`)}
                        className="px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold btn-micro"
                      >
                        Apply Discount
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Suppliers Directory */}
      {activeSubTab === 'suppliers' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Vendor Directory & Credit Ledgers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center card-hover-lift animate-fade-in-up">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sup.companyName}</h4>
                  <p className="text-xs text-slate-400">{sup.contactPerson} • {sup.email}</p>
                  <span className="text-[10px] font-bold text-indigo-500 mt-1 block">Credit terms: {sup.creditTerms}</span>
                </div>
                <button onClick={() => alert(`Purchase Order draft initialized for ${sup.companyName}`)} className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black btn-micro">
                  Create PO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <QuickEditProductModal
        isOpen={!!quickEditProd}
        onClose={() => setQuickEditProd(null)}
        product={quickEditProd}
      />

      <StockAdjustmentModal
        isOpen={!!stockAdjProd}
        onClose={() => setStockAdjProd(null)}
        product={stockAdjProd}
      />

      <ConfirmationModal
        isOpen={!!confirmArchiveId}
        onClose={() => setConfirmArchiveId(null)}
        onConfirm={() => archiveProduct(confirmArchiveId)}
        title="Archive Product"
        message="Are you sure you want to archive this product? It will be hidden from the active POS catalog while preserving historical sales data."
        confirmText="Archive Product"
      />

      {/* Bulk Price Adjustment Dialog */}
      {isBulkPriceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-4xl p-6 relative shadow-2xl bg-white dark:bg-slate-900 space-y-4 animate-fade-scale">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Bulk Price Update</h3>
            <p className="text-xs text-slate-400">Update selling prices for {selectedIds.length} selected items by percentage.</p>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500">Percentage Adjustment (+ / - %)</label>
              <input
                type="number"
                value={bulkPriceChange}
                onChange={(e) => setBulkPriceChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setIsBulkPriceOpen(false)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold btn-micro">{t('common.cancel', 'Cancel')}</button>
              <button 
                onClick={() => {
                  bulkPriceUpdate(selectedIds, bulkPriceChange, false);
                  setIsBulkPriceOpen(false);
                  setSelectedIds([]);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black btn-micro"
              >
                {t('common.confirm', 'Apply Update')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
