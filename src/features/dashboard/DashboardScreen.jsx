import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Clock, 
  Search, 
  QrCode, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Flame, 
  Truck, 
  Target 
} from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import TotalInventoryCapsule from '../../shared/components/TotalInventoryCapsule';
import AnimatedCounter from '../../shared/components/AnimatedCounter';

export default function DashboardScreen({ onViewAllSales }) {
  const { sales, products, purchaseOrders, totalSalesRevenue, addSale, activeCompany, addNotification } = useMultiTenant();
  const { t, formatDate } = useLanguage();

  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [isSaleCompleted, setIsSaleCompleted] = useState(false);

  const recentSales = sales.slice(0, 5);
  const lowStockProducts = products.filter(p => !p.isArchived && p.quantity <= p.lowStockLevel);

  // Expiring Products (< 30 days or already passed)
  const expiringProducts = products.filter(p => {
    if (!p.expiryDate || p.isArchived) return false;
    const expDate = new Date(p.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  // Slow Moving Products (High stock quantity, e.g., > 40 units, but not in recent sales)
  const slowMovingProducts = products.filter(p => !p.isArchived && p.quantity >= 40 && p.sellingPrice >= 30).slice(0, 3);

  // Best Selling Products (Derived from products or sales volume)
  const bestSellers = [...products]
    .filter(p => !p.isArchived)
    .sort((a, b) => (b.profitMargin * b.sellingPrice) - (a.profitMargin * a.sellingPrice))
    .slice(0, 3);

  // Sales Goal Progress ($10,000 monthly target)
  const monthlyTarget = 10000;
  const progressPercent = Math.min(100, Math.round((totalSalesRevenue / monthlyTarget) * 100));

  // POS Search filter
  const posProducts = products.filter(p =>
    !p.isArchived && (
      p.name.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(posSearchTerm.toLowerCase()) ||
      p.barcode.includes(posSearchTerm)
    )
  );

  const addToCart = (product) => {
    if (product.quantity <= 0) return alert(t('status.out_of_stock', 'Product is out of stock!'));
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxRate = activeCompany?.taxRate || 8.5;
  const taxAmount = ((subtotal - discountAmount) * taxRate) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const averageOrderValue = sales.length > 0 ? (totalSalesRevenue / sales.length).toFixed(2) : '0.00';

  const handleCreateSale = () => {
    if (cart.length === 0) return alert(t('pos.cart_empty_title', 'Add products to shopping cart first!'));
    
    addSale({
      customerName: t('pos.walk_in', 'Walk-in Customer'),
      items: cart.map(i => ({ productId: i.id, productName: i.name, quantity: i.quantity, price: i.sellingPrice, total: i.sellingPrice * i.quantity })),
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod,
      employeeName: 'Store Cashier'
    });

    setIsSaleCompleted(true);
    setTimeout(() => {
      setIsSaleCompleted(false);
      setCart([]);
      setDiscountPercent(0);
    }, 2200);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      
      {/* Main Left Workspace (7 Columns) */}
      <div className="xl:col-span-7 flex flex-col space-y-6">
        
        {/* Total Inventory Value Capsule */}
        <TotalInventoryCapsule />

        {/* Executive Commercial KPI Widget Row */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel rounded-3xl p-4 relative overflow-hidden card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.total_revenue', 'Today Revenue')}</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                <AnimatedCounter value={totalSalesRevenue} prefix="$" decimals={2} />
              </span>
              <p className="text-[10px] font-bold text-emerald-500 mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> AOV: ${averageOrderValue}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-4 relative overflow-hidden card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.total_sales', 'Fulfilled Orders')}</span>
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                <AnimatedCounter value={sales.length} />
              </span>
              <p className="text-[10px] font-bold text-emerald-500 mt-0.5">{t('status.completed', '100% Fulfilled')}</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-4 relative overflow-hidden card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.low_stock_alerts', 'Low Stock Alert')}</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                <AnimatedCounter value={lowStockProducts.length} />
              </span>
              <p className="text-[10px] font-bold text-amber-500 mt-0.5">{t('status.low_stock', 'Kayd Hoose')}</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-4 relative overflow-hidden card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('products.exp_date', 'Expiring Soon')}</span>
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                <AnimatedCounter value={expiringProducts.length} />
              </span>
              <p className="text-[10px] font-bold text-rose-500 mt-0.5">&lt; 30 Days Expiry</p>
            </div>
          </div>
        </div>

        {/* Commercial Sales Goal Progress Widget */}
        <div className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between space-y-4 card-hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Monthly Sales Goal Progress</h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Target: ${monthlyTarget.toLocaleString()} / month</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-black">
              {progressPercent}% Achieved
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-700 ease-out shadow-md"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>{t('dashboard.total_revenue', 'Current Revenue')}: ${totalSalesRevenue.toFixed(2)}</span>
              <span>Remaining: ${Math.max(0, monthlyTarget - totalSalesRevenue).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Middle Performance & Best Selling / Slow Moving Products Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Best Selling Cosmetics Widget */}
          <div className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between min-h-[260px] space-y-4 card-hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" /> {t('dashboard.top_selling', 'Best Selling Products')}
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Highest Profit & Sales Velocity</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-black">
                Top Performers
              </span>
            </div>

            <div className="space-y-2.5">
              {bestSellers.length === 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  No products added yet.
                </div>
              ) : (
                bestSellers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs animate-fade-in-up">
                    <div className="flex items-center space-x-3">
                      <img src={item.images[0]} alt={item.name} className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] text-slate-400">SKU: {item.sku} • Stock: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">+${item.sellingPrice.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Slow Moving Products & Clearance Opportunity */}
          <div className="glass-panel rounded-4xl p-6 relative flex flex-col justify-between min-h-[260px] space-y-4 card-hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" /> Slow Moving Inventory
                </h3>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">High stock sitting &gt; 60 days</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-[10px] font-black">
                Clearance Target
              </span>
            </div>

            <div className="space-y-2.5">
              {slowMovingProducts.length === 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                  No slow moving inventory detected.
                </div>
              ) : (
                slowMovingProducts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs animate-fade-in-up">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400">{item.quantity} units sitting • ${item.sellingPrice.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => addNotification('Promotional Action', `Promotional clearance discount triggered for ${item.name}`, 'info')}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-extrabold hover:scale-105 transition-all shrink-0 btn-micro"
                    >
                      Clear Discount
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Recent Purchase Orders & Incoming Restocks */}
        <div className="glass-panel rounded-4xl p-6 relative card-hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-500" /> {t('dashboard.purchases_po', 'Pending Purchase Orders')}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Supplier Restock Pipeline</p>
            </div>
            <button onClick={onViewAllSales} className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-md hover:scale-105 transition-all btn-micro">
              {t('common.view_all', 'View All POs')}
            </button>
          </div>

          <div className="space-y-3">
            {purchaseOrders.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                No purchase orders recorded yet.
              </div>
            ) : (
              purchaseOrders.map((po) => (
                <div key={po.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 animate-fade-in-up">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{po.supplierName}</h4>
                    <p className="text-[11px] font-semibold text-slate-400">{po.poNumber} • Expected {formatDate(po.expectedDelivery)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${po.statusColor}`}>
                      {t(`status.${po.status.toLowerCase().replace(' ', '_')}`, po.status)}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{po.amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: POS Sales Terminal Widget & Live Feed (5 Columns) */}
      <div className="xl:col-span-5 flex flex-col space-y-6">
        
        {/* COMPACT POS SALES TERMINAL WIDGET */}
        <div className="glass-panel rounded-4xl p-6 relative border border-white/60 dark:border-white/10 shadow-lg space-y-4 card-hover-lift">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-500" /> {t('pos.title', 'POS Sales Terminal')}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('pos.subtitle', 'Direct Checkout & Instant Receipt')}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase">
              Terminal Ready
            </span>
          </div>

          {isSaleCompleted ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3 animate-fade-scale">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center border border-emerald-300">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">{t('toasts.sale_completed', 'Sale Completed & Receipt Generated!')}</h4>
              <p className="text-xs text-slate-500 font-medium">Stock levels updated in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Product Search & Barcode Scan Placeholder */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={posSearchTerm}
                    onChange={(e) => setPosSearchTerm(e.target.value)}
                    placeholder={t('common.search_products', 'Search product or SKU...')}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => alert('Barcode Scanner Active - Scan cosmetic product tag.')}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors btn-micro"
                  title="Barcode Scan Placeholder"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Product Pick Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-h-24 flex-wrap">
                {posProducts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-[11px] hover:border-indigo-500 transition-all flex items-center space-x-2 btn-micro"
                  >
                    <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[110px]">{p.name}</span>
                    <span className="font-black text-indigo-500">${p.sellingPrice.toFixed(0)}</span>
                  </button>
                ))}
              </div>

              {/* Shopping Cart List */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('pos.current_cart', 'Shopping Cart')} ({cart.length})</span>
                {cart.length === 0 ? (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                    {t('pos.cart_empty_desc', 'Cart is empty. Click a product above to add.')}
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs animate-fade-in-up">
                      <div className="truncate pr-2">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400">${item.sellingPrice.toFixed(2)} each</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center btn-micro">-</button>
                        <span className="w-4 text-center font-extrabold text-slate-900 dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center btn-micro">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & Totals */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">{t('common.discount', 'Discount')} (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.max(0, Number(e.target.value)))}
                    className="w-16 px-2 py-1 text-right rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-300 font-bold">
                  <span>{t('common.total', 'Grand Total')}</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
                </div>

                {/* Payment Method Selection */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { id: 'Card', labelKey: 'pos.card', icon: CreditCard },
                    { id: 'Cash', labelKey: 'pos.cash', icon: DollarSign },
                    { id: 'Mobile Money', labelKey: 'pos.mobile_money', icon: Smartphone }
                  ].map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center text-[10px] font-extrabold transition-all btn-micro ${
                          paymentMethod === pm.id
                            ? 'border-indigo-500 bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mb-0.5" />
                        <span className="truncate">{t(pm.labelKey, pm.id)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Create Sale Button */}
                <button
                  onClick={handleCreateSale}
                  disabled={cart.length === 0}
                  className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 mt-2 btn-micro"
                >
                  {t('pos.complete_sale', 'Create Sale & Print Receipt')} (${grandTotal.toFixed(2)})
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Recent Sales Feed */}
        <div className="glass-panel rounded-4xl p-6 relative card-hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">{t('dashboard.recent_transactions', 'Recent Sales Feed')}</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Live Customer Checkout Stream</p>
            </div>
            <button onClick={onViewAllSales} className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-md hover:scale-105 transition-all btn-micro">
              {t('common.view_all', 'All Sales')}
            </button>
          </div>

          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                No sales recorded yet. Your live checkout stream will appear here.
              </div>
            ) : (
              recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all animate-fade-in-up">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.customerName}</h4>
                    <span className="text-[10px] font-semibold text-slate-400">{formatDate(s.formattedDate)} • {s.paymentMethod}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">+${s.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
