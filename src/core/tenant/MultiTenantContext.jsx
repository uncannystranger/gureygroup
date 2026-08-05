import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { branchAPI, productAPI, saleAPI } from '../../services/apiService';

const MultiTenantContext = createContext();

export function MultiTenantProvider({ children }) {
  const { tenantCompany, currentUser } = useAuth();
  const activeCompanyId = tenantCompany?.id || currentUser?.companyId || 'comp_default';

  // Keyed state getters/setters scoped by activeCompanyId
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('gurey_companies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return tenantCompany ? [tenantCompany] : [{
      id: activeCompanyId,
      name: tenantCompany?.name || 'My Business Workspace',
      businessType: 'Retail & Wholesale',
      country: 'United States',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'UTC',
      taxRate: 8.5,
      plan: 'Production SaaS',
      branches: [`branch_${activeCompanyId}`],
      warehouses: []
    }];
  });

  const [branches, setBranches] = useState([]);

  const [activeBranchId, setActiveBranchId] = useState(`branch_${activeCompanyId}`);
  const [warehouses, setWarehouses] = useState([]);

  // Isolated Collections - Default to EMPTY arrays for production user isolation
  const [products, setProducts] = useState([]);

  const [sales, setSales] = useState([]);

  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    const saved = localStorage.getItem(`gurey_purchase_orders_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem(`gurey_suppliers_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem(`gurey_customers_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(`gurey_employees_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : (currentUser ? [{
      id: currentUser.uid,
      companyId: activeCompanyId,
      name: currentUser.displayName || 'Owner',
      role: 'Owner',
      email: currentUser.email,
      phone: 'N/A',
      avatar: currentUser.photoURL,
      badge: 'Owner'
    }] : []);
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem(`gurey_activities_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [stockAdjustments, setStockAdjustments] = useState(() => {
    const saved = localStorage.getItem(`gurey_stock_adjustments_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(`gurey_notifications_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [heldCarts, setHeldCarts] = useState(() => {
    const saved = localStorage.getItem(`gurey_held_carts_${activeCompanyId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const normalizeProduct = (product) => ({
    ...product,
    id: product._id || product.id,
    quantity: product.quantity ?? product.stock ?? 0,
    lowStockLevel: product.lowStockLevel ?? product.minStockThreshold ?? 5,
    images: product.images || (product.primaryImage ? [product.primaryImage] : []),
  });

  const normalizeBranch = (branch) => ({
    ...branch,
    id: branch._id || branch.id,
    isActive: branch.status !== 'inactive',
    manager: branch.managerName || branch.manager || '',
  });

  // Re-sync state whenever activeCompanyId changes
  useEffect(() => {
    if (!currentUser?.uid) {
      setProducts([]);
      setBranches([]);
      setSales([]);
      return;
    }

    if (activeCompanyId) {
      productAPI.list()
        .then((data) => setProducts((Array.isArray(data) ? data : []).map(normalizeProduct)))
        .catch((err) => {
          console.warn('[MultiTenant] Failed to load products from backend:', err);
          setProducts([]);
        });

      branchAPI.list()
        .then((data) => setBranches((data.branches || []).map(normalizeBranch)))
        .catch((err) => {
          console.warn('[MultiTenant] Failed to load branches from backend:', err);
          setBranches([]);
        });

      saleAPI.list({ limit: 250 })
        .then((data) => setSales((data.sales || []).map((sale) => ({
          ...sale,
          id: sale._id || sale.id,
          total: sale.totalAmount ?? sale.total ?? 0,
          date: sale.createdAt,
          formattedDate: sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '',
        }))))
        .catch((err) => {
          console.warn('[MultiTenant] Failed to load sales from backend:', err);
          setSales([]);
        });

      const po = localStorage.getItem(`gurey_purchase_orders_${activeCompanyId}`);
      setPurchaseOrders(po ? JSON.parse(po) : []);

      const sup = localStorage.getItem(`gurey_suppliers_${activeCompanyId}`);
      setSuppliers(sup ? JSON.parse(sup) : []);

      const cust = localStorage.getItem(`gurey_customers_${activeCompanyId}`);
      setCustomers(cust ? JSON.parse(cust) : []);

      const act = localStorage.getItem(`gurey_activities_${activeCompanyId}`);
      setActivities(act ? JSON.parse(act) : []);

      const st = localStorage.getItem(`gurey_stock_adjustments_${activeCompanyId}`);
      setStockAdjustments(st ? JSON.parse(st) : []);

      const n = localStorage.getItem(`gurey_notifications_${activeCompanyId}`);
      setNotifications(n ? JSON.parse(n) : []);

      const hc = localStorage.getItem(`gurey_held_carts_${activeCompanyId}`);
      setHeldCarts(hc ? JSON.parse(hc) : []);
    }
  }, [activeCompanyId, currentUser?.uid]);

  // Persist UI-only state that does not have backend routes yet.
  useEffect(() => {
    if (!activeCompanyId) return;
    localStorage.setItem(`gurey_purchase_orders_${activeCompanyId}`, JSON.stringify(purchaseOrders));
    localStorage.setItem(`gurey_suppliers_${activeCompanyId}`, JSON.stringify(suppliers));
    localStorage.setItem(`gurey_customers_${activeCompanyId}`, JSON.stringify(customers));
    localStorage.setItem(`gurey_employees_${activeCompanyId}`, JSON.stringify(employees));
    localStorage.setItem(`gurey_activities_${activeCompanyId}`, JSON.stringify(activities));
    localStorage.setItem(`gurey_stock_adjustments_${activeCompanyId}`, JSON.stringify(stockAdjustments));
    localStorage.setItem(`gurey_notifications_${activeCompanyId}`, JSON.stringify(notifications));
    localStorage.setItem(`gurey_held_carts_${activeCompanyId}`, JSON.stringify(heldCarts));
  }, [activeCompanyId, purchaseOrders, suppliers, customers, employees, activities, stockAdjustments, notifications, heldCarts]);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || (tenantCompany || companies[0]);
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  // Scoped Data getters
  const companyProducts = products.filter(p => p.companyId === activeCompanyId || !p.companyId);
  const companySales = sales.filter(s => s.companyId === activeCompanyId || !s.companyId);
  const companySuppliers = suppliers.filter(s => s.companyId === activeCompanyId || !s.companyId);
  const companyCustomers = customers.filter(c => c.companyId === activeCompanyId || !c.companyId);
  const companyEmployees = employees.filter(e => e.companyId === activeCompanyId || !e.companyId);
  const companyPurchaseOrders = purchaseOrders.filter(po => po.companyId === activeCompanyId || !po.companyId);
  const companyStockAdjustments = stockAdjustments.filter(a => a.companyId === activeCompanyId || !a.companyId);

  // Calculated Inventory Valuation (Safely handles 0 inventory)
  const activeProductsList = companyProducts.filter(p => !p.isArchived);
  const totalInventoryValue = activeProductsList.reduce((acc, p) => acc + ((p.costPrice || 0) * (p.quantity || 0)), 0);
  const totalRetailPotentialValue = activeProductsList.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
  const totalSalesRevenue = companySales.reduce((acc, s) => acc + (s.total || 0), 0);

  // Add Notification
  const addNotification = (title, message, type = 'info') => {
    const newNotif = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Just now',
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Add Product
  const addProduct = async (newProduct) => {
    const costPrice = parseFloat(newProduct.costPrice) || 0;
    const sellingPrice = parseFloat(newProduct.sellingPrice) || 0;
    const qty = parseInt(newProduct.quantity, 10) || 0;

    const created = await productAPI.create({
      ...newProduct,
      branchId: activeBranchId,
      costPrice,
      sellingPrice,
      stock: qty,
      minStockThreshold: parseInt(newProduct.lowStockLevel, 10) || 5,
      images: newProduct.images || [],
      primaryImage: newProduct.images?.[0] || '',
    });

    const productWithId = normalizeProduct(created);
    setProducts(prev => [productWithId, ...prev]);
    logActivity(`Added Product: ${newProduct.name}`);
    addNotification('Product Added', `${newProduct.name} (SKU: ${newProduct.sku}) added to catalog.`, 'success');
    return productWithId;
  };

  // Update Product
  const updateProduct = async (productId, updatedFields) => {
    const saved = await productAPI.update(productId, updatedFields);
    const normalized = normalizeProduct(saved);
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return normalized;
      }
      return p;
    }));
    logActivity(`Updated Product Details (ID: ${productId})`);
    addNotification('Product Updated', 'Product details saved successfully.', 'info');
    return normalized;
  };

  // Duplicate Product
  const duplicateProduct = async (productId) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const duplicated = await productAPI.create({
      name: `${target.name} (Copy)`,
      sku: `${target.sku}-COPY`,
      barcode: '',
      brand: target.brand,
      category: target.category,
      supplier: target.supplier,
      description: target.description,
      costPrice: target.costPrice,
      sellingPrice: target.sellingPrice,
      stock: target.quantity,
      minStockThreshold: target.lowStockLevel,
      images: target.images || [],
      primaryImage: target.primaryImage || target.images?.[0] || '',
    });

    const normalized = normalizeProduct(duplicated);
    setProducts(prev => [normalized, ...prev]);
    logActivity(`Duplicated Product: ${target.name}`);
    addNotification('Product Duplicated', `Created copy: ${normalized.name}`, 'success');
  };

  // Archive / Restore Product
  const archiveProduct = async (productId) => {
    await productAPI.archive(productId);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isArchived: true } : p));
    logActivity(`Archived Product ID: ${productId}`);
    addNotification('Product Archived', 'Product moved to archived catalog.', 'warning');
  };

  const restoreProduct = async (productId) => {
    const restored = await productAPI.update(productId, { isArchived: false });
    const normalized = normalizeProduct(restored);
    setProducts(prev => prev.map(p => p.id === productId ? normalized : p));
    logActivity(`Restored Product ID: ${productId}`);
    addNotification('Product Restored', 'Product restored to active catalog.', 'success');
  };

  // Bulk Price Update
  const bulkPriceUpdate = async (productIds, percentageChange, isFixed = false) => {
    const updates = await Promise.all(products
      .filter(p => productIds.includes(p.id))
      .map(async (p) => {
        let newSellingPrice = p.sellingPrice;
        if (isFixed) {
          newSellingPrice = Math.max(0, p.sellingPrice + percentageChange);
        } else {
          newSellingPrice = Math.max(0, p.sellingPrice * (1 + percentageChange / 100));
        }
        return normalizeProduct(await productAPI.update(p.id, {
          sellingPrice: parseFloat(newSellingPrice.toFixed(2)),
        }));
      }));
    setProducts(prev => prev.map(p => updates.find(u => u.id === p.id) || p));
    logActivity(`Bulk price update performed on ${productIds.length} products`);
    addNotification('Bulk Prices Updated', `Updated prices for ${productIds.length} items.`, 'success');
  };

  // Bulk Stock Adjustment
  const bulkStockUpdate = async (productIds, deltaQty, reason = 'Bulk Adjustment') => {
    const updates = await Promise.all(products
      .filter(p => productIds.includes(p.id))
      .map(async (p) => {
        const newQty = Math.max(0, p.quantity + deltaQty);
        logStockAdjustment(p.id, p.name, p.sku, deltaQty, reason);
        return normalizeProduct(await productAPI.update(p.id, { stock: newQty }));
      }));
    setProducts(prev => prev.map(p => updates.find(u => u.id === p.id) || p));
    logActivity(`Bulk stock adjustment on ${productIds.length} products (${deltaQty > 0 ? '+' : ''}${deltaQty})`);
    addNotification('Bulk Stock Adjusted', `Adjusted stock for ${productIds.length} items.`, 'info');
  };

  // Bulk Category Assign
  const bulkCategoryAssign = (productIds, category) => {
    setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, category } : p));
    logActivity(`Bulk reassigned category to '${category}' for ${productIds.length} products`);
    addNotification('Category Updated', `Assigned ${productIds.length} items to ${category}.`, 'success');
  };

  // Bulk Archive
  const bulkArchiveProducts = async (productIds) => {
    await Promise.all(productIds.map(id => productAPI.archive(id)));
    setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, isArchived: true } : p));
    logActivity(`Bulk archived ${productIds.length} products`);
    addNotification('Bulk Archiving', `Archived ${productIds.length} products.`, 'warning');
  };

  // Log Stock Adjustment Audit
  const logStockAdjustment = (productId, productName, sku, delta, reason) => {
    const adjustment = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: activeCompanyId,
      productId,
      productName,
      sku,
      delta,
      reason,
      timestamp: new Date().toISOString(),
      user: currentUser?.displayName || 'Active User'
    };
    setStockAdjustments(prev => [adjustment, ...prev]);
  };

  // Add Sale Workflow
  const addSale = async (saleData) => {
    const saved = await saleAPI.create({
      ...saleData,
      branchId: activeBranchId,
      branchName: activeBranch?.name || '',
      posTerminalId: saleData.posTerminalId || 'web-pos',
      cashierName: saleData.cashierName || saleData.employeeName || currentUser?.displayName || currentUser?.email,
      employeeId: saleData.employeeId || currentUser?.uid,
      totalAmount: saleData.total,
      taxRate: activeCompany?.taxRate || 0,
    });

    const sale = saved.sale;
    const newSale = {
      ...sale,
      id: sale._id,
      total: sale.totalAmount,
      date: sale.createdAt,
      formattedDate: sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'Just now',
    };

    setSales(prev => [newSale, ...prev]);

    // Update Product Quantities
    if (saleData.items) {
      setProducts(prevProducts => {
        return prevProducts.map(p => {
          const itemInSale = saleData.items.find(i => i.productId === p.id);
          if (itemInSale) {
            const newQty = Math.max(0, p.quantity - itemInSale.quantity);
            const status = newQty === 0 ? 'Out of Stock' : (newQty <= p.lowStockLevel ? 'Low Stock' : 'In Stock');
            
            if (newQty <= p.lowStockLevel) {
              addNotification('Low Stock Warning', `${p.name} quantity (${newQty}) reached alert threshold!`, 'warning');
            }

            logStockAdjustment(p.id, p.name, p.sku, -itemInSale.quantity, 'POS Sale');
            return {
              ...p,
              quantity: newQty,
              status
            };
          }
          return p;
        });
      });
    }

    // Update customer loyalty points
    if (saleData.customerName && saleData.customerName !== 'Walk-in Customer') {
      const earnedPoints = Math.floor(saleData.total);
      setCustomers(prev => prev.map(c => {
        if (c.name.toLowerCase() === saleData.customerName.toLowerCase()) {
          const prevPoints = c.loyaltyPoints || 0;
          const currentSpentNum = parseFloat((c.totalSpent || '$0').replace(/[^0-9.]/g, '')) || 0;
          return {
            ...c,
            loyaltyPoints: prevPoints + earnedPoints,
            totalSpent: `$${(currentSpentNum + saleData.total).toFixed(2)}`,
            lastPurchase: 'Today'
          };
        }
        return c;
      }));
    }

    logActivity(`Completed Sale ${newSale.receiptNumber} ($${newSale.total.toFixed(2)}) via ${newSale.paymentMethod}`);
    addNotification('Sale Completed', `Receipt #${newSale.receiptNumber} processed ($${newSale.total.toFixed(2)})`, 'success');
    return newSale;
  };

  // Refund Workflow
  const processRefund = (saleId, returnedItems, reason, refundMethod = 'Cash') => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    let totalRefundAmount = 0;

    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const returnedItem = returnedItems.find(r => r.productId === p.id);
        if (returnedItem) {
          const qtyToAdd = returnedItem.quantity;
          const newQty = p.quantity + qtyToAdd;
          totalRefundAmount += (returnedItem.price * qtyToAdd);
          
          logStockAdjustment(p.id, p.name, p.sku, qtyToAdd, `Return / Refund: ${reason}`);
          return {
            ...p,
            quantity: newQty,
            status: newQty > p.lowStockLevel ? 'In Stock' : 'Low Stock'
          };
        }
        return p;
      });
    });

    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        return {
          ...s,
          isRefunded: true,
          refundAmount: totalRefundAmount,
          refundReason: reason,
          refundDate: new Date().toISOString()
        };
      }
      return s;
    }));

    logActivity(`Processed Refund for Sale #${sale.receiptNumber} ($${totalRefundAmount.toFixed(2)})`);
    addNotification('Refund Processed', `Refund of $${totalRefundAmount.toFixed(2)} issued for Receipt ${sale.receiptNumber}.`, 'warning');
  };

  // Hold Cart Workflow
  const holdCart = (cartItems, customerName = 'Walk-in Customer', discount = 0, note = '') => {
    if (cartItems.length === 0) return;
    const newHeld = {
      id: `hold_${Date.now()}`,
      items: cartItems,
      customerName,
      discount,
      note: note || `Cart with ${cartItems.length} item(s)`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHeldCarts(prev => [newHeld, ...prev]);
    logActivity(`Placed cart on hold (${cartItems.length} items)`);
    addNotification('Cart Held', `Placed cart on hold for ${customerName}`, 'info');
  };

  const restoreHeldCart = (heldId) => {
    const target = heldCarts.find(h => h.id === heldId);
    if (!target) return null;
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    addNotification('Cart Resumed', `Restored held cart with ${target.items.length} items.`, 'success');
    return target;
  };

  const deleteHeldCart = (heldId) => {
    setHeldCarts(prev => prev.filter(h => h.id !== heldId));
  };

  // Add Customer Quick Action
  const addCustomer = (customerData) => {
    const newCust = {
      id: `cust_${Date.now()}`,
      companyId: activeCompanyId,
      name: customerData.name,
      phone: customerData.phone || 'N/A',
      email: customerData.email || 'N/A',
      group: customerData.group || 'Regular Retail',
      loyaltyPoints: 0,
      totalSpent: '$0.00',
      outstandingBalance: '$0.00',
      lastPurchase: 'Never'
    };
    setCustomers(prev => [newCust, ...prev]);
    logActivity(`Registered New Customer: ${newCust.name}`);
    addNotification('Customer Created', `${newCust.name} added to customer ledger.`, 'success');
    return newCust;
  };

  // Create Company
  const createCompany = (companyConfig) => {
    const newCompanyId = `comp_${Date.now()}`;
    const newBranchId = `branch_${Date.now()}`;

    const newCompany = {
      id: newCompanyId,
      name: companyConfig.name || 'New Organization',
      logo: companyConfig.logo || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=150&q=80',
      businessType: companyConfig.businessType || 'Retail',
      country: companyConfig.country || 'United States',
      currency: companyConfig.currency || 'USD',
      currencySymbol: companyConfig.currency === 'EUR' ? '€' : '$',
      timezone: companyConfig.timezone || 'UTC',
      taxRate: parseFloat(companyConfig.taxRate) || 8.5,
      plan: 'Production SaaS',
      branches: [newBranchId],
      warehouses: []
    };

    const newBranch = {
      id: newBranchId,
      companyId: newCompanyId,
      name: companyConfig.initialBranch || 'Main Branch',
      code: 'BR-01',
      city: companyConfig.country || 'Main Location',
      phone: '+1 555-0100',
      manager: currentUser?.displayName || 'Owner',
      isActive: true
    };

    setCompanies(prev => [...prev, newCompany]);
    setBranches(prev => [...prev, newBranch]);
    logActivity(`Created new business workspace: ${newCompany.name}`);
  };

  const logActivity = (text) => {
    setActivities(prev => [
      { id: `act_${Date.now()}`, time: 'Just now', user: currentUser?.displayName || 'Active User', text },
      ...prev
    ]);
  };

  return (
    <MultiTenantContext.Provider value={{
      companies,
      activeCompany,
      activeCompanyId,
      branches,
      activeBranch,
      activeBranchId,
      setActiveBranchId,
      warehouses,
      products: companyProducts,
      allProducts: products,
      sales: companySales,
      suppliers: companySuppliers,
      customers: companyCustomers,
      employees: companyEmployees,
      purchaseOrders: companyPurchaseOrders,
      activities,
      stockAdjustments: companyStockAdjustments,
      notifications,
      heldCarts,
      totalInventoryValue,
      totalRetailPotentialValue,
      totalSalesRevenue,
      addProduct,
      updateProduct,
      duplicateProduct,
      archiveProduct,
      restoreProduct,
      bulkPriceUpdate,
      bulkStockUpdate,
      bulkCategoryAssign,
      bulkArchiveProducts,
      logStockAdjustment,
      addSale,
      processRefund,
      holdCart,
      restoreHeldCart,
      deleteHeldCart,
      addCustomer,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      createCompany,
      logActivity
    }}>
      {children}
    </MultiTenantContext.Provider>
  );
}

export function useMultiTenant() {
  return useContext(MultiTenantContext);
}
