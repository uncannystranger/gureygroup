import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  CheckCircle2, 
  Receipt, 
  FileText, 
  Users,
  PauseCircle,
  RotateCcw,
  UserPlus
} from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';
import ReceiptModal from '../../shared/components/ReceiptModal';
import InvoiceModal from '../../shared/components/InvoiceModal';
import HeldCartsModal from '../../shared/components/HeldCartsModal';
import AddCustomerModal from '../../shared/components/AddCustomerModal';

function POSProductImageWithSkeleton({ src, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-20 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl overflow-hidden mb-2">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-300/60 dark:bg-slate-700/60" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function POSScreen() {
  const { 
    products, 
    sales, 
    addSale, 
    activeCompany, 
    customers, 
    heldCarts, 
    holdCart, 
    processRefund
  } = useMultiTenant();

  const { t, formatDate } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [selectedCustomer, setSelectedCustomer] = useState(t('pos.walk_in', 'Walk-in Customer'));
  const [cashTendered, setCashTendered] = useState('');

  // Modals state
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Return & Refund State
  const [selectedRefundSale, setSelectedRefundSale] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer Mind Changed');

  const filteredProducts = products.filter(p => 
    !p.isArchived && (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm)
    )
  );

  // Barcode Scanner Simulator: If search exact match barcode or SKU, add immediately on Enter
  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const match = products.find(p => !p.isArchived && (p.barcode === searchTerm.trim() || p.sku.toLowerCase() === searchTerm.trim().toLowerCase()));
      if (match) {
        addToCart(match);
        setSearchTerm('');
      }
    }
  };

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

  const cashTenderedVal = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashTenderedVal - grandTotal);

  const handleCheckout = () => {
    if (cart.length === 0) return alert(t('pos.cart_empty_title', 'Cart is empty!'));

    if (paymentMethod === 'Cash' && cashTenderedVal < grandTotal) {
      return alert(`Cash tendered ($${cashTenderedVal.toFixed(2)}) is less than total amount due ($${grandTotal.toFixed(2)})!`);
    }

    const saleData = {
      customerName: selectedCustomer || t('pos.walk_in', 'Walk-in Customer'),
      items: cart.map(i => ({ productId: i.id, productName: i.name, quantity: i.quantity, price: i.sellingPrice, total: i.sellingPrice * i.quantity })),
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod,
      employeeName: 'Ahmed Cashier'
    };

    addSale(saleData);
    setLastCompletedSale({
      ...saleData,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      formattedDate: 'Just now'
    });

    setIsCompleted(true);
    setIsReceiptModalOpen(true);

    setTimeout(() => {
      setIsCompleted(false);
      setCart([]);
      setDiscountPercent(0);
      setCashTendered('');
    }, 1500);
  };

  const handleHoldCurrentCart = () => {
    if (cart.length === 0) return alert(t('pos.cart_empty_title', 'Cart is empty!'));
    holdCart(cart, selectedCustomer, discountPercent, `Cart with ${cart.length} item(s)`);
    setCart([]);
    setDiscountPercent(0);
  };

  const handleResumeCart = (heldData) => {
    setCart(heldData.items);
    setSelectedCustomer(heldData.customerName);
    setDiscountPercent(heldData.discount || 0);
  };

  const handleProcessRefundSubmit = () => {
    if (!selectedRefundSale) return;
    processRefund(selectedRefundSale.id, selectedRefundSale.items, refundReason, 'Cash');
    setSelectedRefundSale(null);
    alert(`Refund processed successfully for Receipt ${selectedRefundSale.receiptNumber}`);
  };

  const salesSubTabs = [
    { id: 'pos', labelKey: 'pos.title', defaultLabel: 'POS Terminal', icon: ShoppingCart },
    { id: 'orders', labelKey: 'pos.receipt_preview', defaultLabel: 'Orders & Receipts', icon: Receipt },
    { id: 'invoices', labelKey: 'pos.invoice_preview', defaultLabel: 'Commercial Invoices', icon: FileText },
    { id: 'returns', labelKey: 'status.cancelled', defaultLabel: 'Returns & Refunds', icon: RotateCcw },
    { id: 'customers', labelKey: 'pos.select_customer', defaultLabel: 'Customers Directory', icon: Users },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Sub-Navigation Tabs for Sales Section */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl glass-panel border border-white/60 dark:border-white/10">
        {salesSubTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
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

      {/* View 1: POS Terminal */}
      {activeSubTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Products Search & Selection Grid (7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="p-4 rounded-3xl glass-panel border border-white/60 dark:border-white/10 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDownSearch}
                  placeholder={t('pos.search_catalog', 'Scan barcode or type SKU/Name...')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsHeldModalOpen(true)}
                  className="px-3.5 py-2 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-xs font-black flex items-center space-x-1.5 shadow-sm hover:scale-105 transition-all btn-micro"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>{t('pos.held_carts', 'Held Carts')} ({heldCarts.length})</span>
                </button>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[68vh] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-xs font-semibold text-slate-400">No products in your catalog yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Add products to start selling.</p>
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    disabled={prod.quantity <= 0}
                    className={`p-3 rounded-3xl glass-panel text-left flex flex-col justify-between h-44 hover:scale-[1.02] transition-all border border-white/60 dark:border-white/10 card-hover-lift animate-fade-in-up ${
                      prod.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div>
                      <POSProductImageWithSkeleton src={prod.images[0]} alt={prod.name} />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{prod.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-400">SKU: {prod.sku}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      <span className="text-xs font-black text-slate-900 dark:text-white">${prod.sellingPrice.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-indigo-500">Qty: {prod.quantity}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>

          {/* POS Shopping Cart & Checkout Terminal (5 Columns) */}
          <div className="lg:col-span-5 glass-panel rounded-4xl p-6 relative flex flex-col justify-between min-h-[75vh] card-hover-lift">
            
            {isCompleted ? (
              <div className="my-auto text-center space-y-4 animate-fade-scale">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-300">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('toasts.sale_completed', 'Sale Completed!')}</h3>
                <p className="text-xs font-medium text-slate-500">Thermal receipt generated & stock updated.</p>
              </div>
            ) : (
              <>
                <div>
                  
                  {/* Customer Selector & Order Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value={t('pos.walk_in', 'Walk-in Customer')}>{t('pos.walk_in', 'Walk-in Customer')}</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.loyaltyPoints || 0} pts)</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors btn-micro"
                        title={t('pos.select_customer', 'Quick Add Customer')}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={handleHoldCurrentCart}
                      disabled={cart.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold disabled:opacity-40 hover:scale-105 transition-all btn-micro"
                    >
                      {t('pos.hold_cart', 'Hold Cart')}
                    </button>
                  </div>

                  {/* Cart Line Items */}
                  <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl animate-fade-scale">
                        <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('pos.cart_empty_title', 'Cart is currently empty')}</h4>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('pos.cart_empty_desc', 'Scan a barcode or click products from the catalog to add items.')}</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/5 animate-fade-in-up">
                          <div className="flex-1 pr-2">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h5>
                            <p className="text-[10px] font-semibold text-slate-400">${item.sellingPrice.toFixed(2)} each</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center btn-micro">-</button>
                            <span className="text-xs font-black text-slate-900 dark:text-white w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center btn-micro">+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Totals & Payment Section */}
                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
                  
                  {/* Preset Discounts */}
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">{t('common.discount', 'Discount')} (%)</span>
                    <div className="flex items-center space-x-1">
                      {[0, 5, 10, 15].map(d => (
                        <button
                          key={d}
                          onClick={() => setDiscountPercent(d)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold btn-micro ${
                            discountPercent === d ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {d}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>{t('common.subtotal', 'Subtotal')}</span>
                      <span className="font-bold text-slate-900 dark:text-white">${subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>{t('common.discount', 'Discount')} ({discountPercent}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('common.tax', 'Tax')} ({taxRate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span>{t('common.total', 'Grand Total')}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'Card', labelKey: 'pos.card', icon: CreditCard },
                      { id: 'Cash', labelKey: 'pos.cash', icon: DollarSign },
                      { id: 'Mobile Money', labelKey: 'pos.mobile_money', icon: Smartphone }
                    ].map((pm) => {
                      const Icon = pm.icon;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-2 rounded-2xl border flex flex-col items-center text-[10px] font-bold transition-all btn-micro ${
                            paymentMethod === pm.id
                              ? 'border-indigo-500 bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-0.5" />
                          {t(pm.labelKey, pm.id)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash Tendered & Change Calculator */}
                  {paymentMethod === 'Cash' && (
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 space-y-2 text-xs font-semibold animate-fade-in-up">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{t('pos.amount_paid', 'Cash Tendered')} ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder={grandTotal.toFixed(2)}
                          className="w-24 px-2 py-1 text-right rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400">
                        <span>{t('pos.change_due', 'Change Due')}:</span>
                        <span>${changeDue.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 btn-micro"
                  >
                    {t('pos.complete_sale', 'Complete Sale')} (${grandTotal.toFixed(2)})
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View 2: Orders & Receipts History */}
      {activeSubTab === 'orders' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Sales Orders & Thermal Receipt Stream</h3>
          <div className="space-y-3">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.receiptNumber} • {s.customerName}</h4>
                  <p className="text-[11px] text-slate-400">{formatDate(s.formattedDate)} • Payment Method: {s.paymentMethod}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-black text-slate-900 dark:text-white">${s.total.toFixed(2)}</span>
                  <button 
                    onClick={() => { setLastCompletedSale(s); setIsReceiptModalOpen(true); }} 
                    className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-bold shadow-sm btn-micro"
                  >
                    {t('pos.view_receipt', 'Print Thermal Receipt')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 3: Commercial Invoices Archive */}
      {activeSubTab === 'invoices' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Commercial Tax Invoices Archive</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase">
                  <th className="pb-3">Invoice ID</th>
                  <th className="pb-3">{t('pos.select_customer', 'Customer')}</th>
                  <th className="pb-3">{t('common.date', 'Issued Date')}</th>
                  <th className="pb-3">{t('common.status', 'Status')}</th>
                  <th className="pb-3 text-right">{t('common.total', 'Total')}</th>
                  <th className="pb-3 text-right">{t('common.actions', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 animate-fade-in-up">
                    <td className="py-3 font-mono font-bold text-indigo-500">INV-{s.receiptNumber?.replace('REC-', '')}</td>
                    <td className="py-3 font-extrabold text-slate-900 dark:text-white">{s.customerName}</td>
                    <td className="py-3 text-slate-400">{formatDate(s.formattedDate)}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                        {t('status.paid', 'PAID')}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900 dark:text-white">${s.total.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => { setLastCompletedSale(s); setIsInvoiceModalOpen(true); }}
                        className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold hover:bg-indigo-500 hover:text-white transition-colors btn-micro"
                      >
                        {t('pos.invoice_preview', 'View Invoice')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 4: Returns & Refunds Workflow */}
      {activeSubTab === 'returns' && (
        <div className="glass-panel rounded-4xl p-6 space-y-6 card-hover-lift">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Customer Returns & Refund Management</h3>
            <p className="text-xs font-medium text-slate-400">Process sale returns, issue cash/card refunds, and restock inventory</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales List for Return */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Completed Sale for Return</span>
              {sales.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedRefundSale(s)}
                  className={`p-4 rounded-3xl cursor-pointer transition-all border card-hover-lift animate-fade-in-up ${
                    selectedRefundSale?.id === s.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.receiptNumber} • {s.customerName}</h4>
                    <span className="text-xs font-black text-indigo-500">${s.total.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{formatDate(s.formattedDate)} • {s.items?.length || 0} line item(s)</p>
                </div>
              ))}
            </div>

            {/* Refund Action Box */}
            <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Refund Processing Panel</h4>

              {selectedRefundSale ? (
                <div className="space-y-4 text-xs font-semibold animate-fade-scale">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">Receipt: {selectedRefundSale.receiptNumber}</p>
                    <p className="text-slate-400">Total Refund Value: ${selectedRefundSale.total?.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Return Reason</label>
                    <select
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Customer Mind Changed">Customer Mind Changed</option>
                      <option value="Defective Product">Defective / Damaged Packaging</option>
                      <option value="Wrong Shade/Variant">Wrong Shade / Variant Picked</option>
                    </select>
                  </div>

                  <button
                    onClick={handleProcessRefundSubmit}
                    className="w-full py-3 rounded-full bg-rose-600 text-white font-black text-xs shadow-lg hover:bg-rose-700 transition-all btn-micro"
                  >
                    Issue Refund & Restock Items (${selectedRefundSale.total?.toFixed(2)})
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Click a sale on the left to initialize return refund workflow.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* View 5: Customers & Loyalty Directory */}
      {activeSubTab === 'customers' && (
        <div className="glass-panel rounded-4xl p-6 space-y-4 card-hover-lift">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Customer Directory & Reward Ledger</h3>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black shadow-md flex items-center space-x-1.5 btn-micro"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(customers || []).map((c) => (
              <div key={c.id} className="p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 card-hover-lift animate-fade-in-up">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                <p className="text-xs text-slate-400">{c.phone} • {c.email}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-bold">
                  <span className="text-indigo-500">{c.loyaltyPoints || 0} Loyalty Points</span>
                  <span className="text-emerald-500">{c.totalSpent} Spent</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sale={lastCompletedSale}
      />

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        sale={lastCompletedSale}
      />

      <HeldCartsModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
        onResumeCart={handleResumeCart}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerAdded={(newCust) => setSelectedCustomer(newCust.name)}
      />

    </div>
  );
}
