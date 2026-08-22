import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { branchAPI, productAPI, saleAPI, customerAPI, teamAPI, inventoryAPI } from '../../services/apiService';

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

  /**
   * Load status for the branch-scoped collections. Screens need to tell
   * "still loading", "loaded and genuinely empty" and "the request failed"
   * apart — an empty array alone cannot express that.
   */
  const [dataStatus, setDataStatus] = useState({
    branches: 'idle',
    products: 'idle',
    sales: 'idle',
  });
  const [dataError, setDataError] = useState({ branches: null, products: null, sales: null });

  const markStatus = (key, status, error = null) => {
    setDataStatus((prev) => (prev[key] === status ? prev : { ...prev, [key]: status }));
    setDataError((prev) => (prev[key] === error ? prev : { ...prev, [key]: error }));
  };

  const [activeBranchId, setActiveBranchIdState] = useState(() => localStorage.getItem('gurey_active_branch_id') || '');
  const [dataRefreshToken, setDataRefreshToken] = useState(0);
  const [warehouses, setWarehouses] = useState([]);

  // Isolated Collections - Default to EMPTY arrays for production user isolation
  const [products, setProducts] = useState([]);

  const [sales, setSales] = useState([]);

  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [suppliers, setSuppliers] = useState([]);

  // Customers are workspace data, not device data — they come from the API.
  const [customers, setCustomers] = useState([]);

  const [employees, setEmployees] = useState([]);

  // Activity history is the server-side audit log; nothing is kept here.
  const [activities, setActivities] = useState([]);

  const [stockAdjustments, setStockAdjustments] = useState([]);

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
    name: product.name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
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

  const refreshBranches = async () => {
    markStatus('branches', 'loading');
    const data = await branchAPI.list();
    const nextBranches = (data.branches || []).map(normalizeBranch);
    setBranches(nextBranches);
    setActiveBranchIdState((current) => {
      const saved = localStorage.getItem(`gurey_active_branch_${activeCompanyId}`);
      const preferred = nextBranches.find((branch) => branch.id === current || branch.id === saved);
      return preferred?.id || nextBranches.find((branch) => branch.isActive)?.id || '';
    });
    markStatus('branches', 'ready');
    return nextBranches;
  };

  // Re-sync state whenever activeCompanyId changes
  useEffect(() => {
    if (!currentUser?.uid) {
      setProducts([]);
      setBranches([]);
      setSales([]);
      return;
    }

    if (activeCompanyId) {
      loadCustomers();
      loadEmployees();
      loadSuppliers();
      loadPurchaseOrders();
      refreshBranches()
        .catch((err) => {
          console.warn('[MultiTenant] Failed to load branches from backend:', err);
          setBranches([]);
          markStatus('branches', 'error', err.message || 'Unable to load branches.');
        });

    }
  }, [activeCompanyId, currentUser?.uid]);

  const loadProducts = (branchId) => {
    markStatus('products', 'loading');
    return productAPI.list(branchId)
      .then((data) => {
        setProducts((Array.isArray(data) ? data : []).map(normalizeProduct));
        markStatus('products', 'ready');
      })
      .catch((err) => {
        console.warn('[MultiTenant] Failed to load products from backend:', err);
        setProducts([]);
        markStatus('products', 'error', err.message || 'Unable to load the product catalog.');
      });
  };

  const loadSales = (branchId) => {
    markStatus('sales', 'loading');
    return saleAPI.list({ branchId, limit: 250 })
      .then((data) => {
        setSales((data.sales || []).map((sale) => ({
          ...sale,
          id: sale._id || sale.id,
          total: sale.totalAmount ?? sale.total ?? 0,
          date: sale.createdAt,
          formattedDate: sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '',
        })));
        markStatus('sales', 'ready');
      })
      .catch((err) => {
        console.warn('[MultiTenant] Failed to load sales from backend:', err);
        setSales([]);
        markStatus('sales', 'error', err.message || 'Unable to load sales.');
      });
  };

  const normalizeCustomer = (customer) => ({
    ...customer,
    id: customer._id || customer.id,
    companyId: customer.companyId,
  });

  const loadCustomers = () => customerAPI.list()
    .then((data) => setCustomers((data.customers || []).map(normalizeCustomer)))
    .catch((err) => {
      console.warn('[MultiTenant] Failed to load customers:', err.message);
      setCustomers([]);
    });

  /**
   * The roster powers the POS cashier selector. Only roles that may view the
   * team can read it; everyone else works as themselves.
   */
  const loadEmployees = () => teamAPI.getMembers()
    .then((data) => setEmployees((data.members || []).map((m) => ({
      id: m.userId,
      companyId: m.companyId,
      name: m.displayName,
      email: m.email,
      role: m.role,
      avatar: m.photoURL,
      badge: m.role,
      status: m.status,
    }))))
    .catch(() => {
      setEmployees(currentUser ? [{
        id: currentUser.uid,
        companyId: activeCompanyId,
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        role: currentUser.role || 'Employee',
        avatar: currentUser.photoURL,
        badge: currentUser.role || 'Employee',
      }] : []);
    });

  const loadSuppliers = () => inventoryAPI.listSuppliers()
    .then((data) => setSuppliers((data.suppliers || []).map((x) => ({ ...x, id: x._id }))))
    .catch((err) => { console.warn('[MultiTenant] Failed to load suppliers:', err.message); setSuppliers([]); });

  const loadPurchaseOrders = () => inventoryAPI.listPurchaseOrders()
    .then((data) => setPurchaseOrders((data.purchaseOrders || []).map((x) => ({ ...x, id: x._id }))))
    .catch((err) => { console.warn('[MultiTenant] Failed to load purchase orders:', err.message); setPurchaseOrders([]); });

  const loadStockAdjustments = (branchId) => inventoryAPI.listStockAdjustments(branchId, { limit: 200 })
    .then((data) => setStockAdjustments((data.adjustments || []).map((x) => ({
      ...x,
      id: x._id,
      timestamp: x.createdAt,
      user: x.userName,
    }))))
    .catch((err) => { console.warn('[MultiTenant] Failed to load stock history:', err.message); setStockAdjustments([]); });

  /** Bumped to re-run the branch-scoped loaders (used by "Retry" affordances). */
  const refreshWorkspaceData = () => setDataRefreshToken((token) => token + 1);

  // The selected branch is the data boundary for every branch-aware view.
  useEffect(() => {
    if (!activeCompanyId || !activeBranchId || !currentUser?.uid) return;
    localStorage.setItem('gurey_active_branch_id', activeBranchId);
    localStorage.setItem(`gurey_active_branch_${activeCompanyId}`, activeBranchId);

    loadProducts(activeBranchId);
    loadSales(activeBranchId);
    loadStockAdjustments(activeBranchId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompanyId, activeBranchId, currentUser?.uid, dataRefreshToken]);

  const setActiveBranchId = (branchId) => {
    if (!branches.some((branch) => branch.id === branchId && branch.isActive)) return;
    setActiveBranchIdState(branchId);
  };

  // Persist UI-only state that does not have backend routes yet.
  useEffect(() => {
    if (!activeCompanyId) return;
    localStorage.setItem(`gurey_notifications_${activeCompanyId}`, JSON.stringify(notifications));
    localStorage.setItem(`gurey_held_carts_${activeCompanyId}`, JSON.stringify(heldCarts));
  }, [activeCompanyId, notifications, heldCarts]);

  // The authenticated workspace is the source of truth. The cached `companies`
  // list only fills gaps — otherwise a stale localStorage entry (with its
  // placeholder 8.5% tax rate) silently overrode the real organization settings.
  const cachedCompany = companies.find(c => c.id === activeCompanyId) || companies[0];
  const activeCompany = (tenantCompany || cachedCompany)
    ? { ...(cachedCompany || {}), ...(tenantCompany || {}) }
    : null;
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  // Scoped Data getters
  const companyProducts = products.filter(p => p.companyId === activeCompanyId && p.branchId === activeBranchId);
  const companySales = sales.filter(s => s.companyId === activeCompanyId && s.branchId === activeBranchId);
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
        return normalizeProduct(await productAPI.update(p.id, { stock: newQty, adjustmentReason: reason }));
      }));
    setProducts(prev => prev.map(p => updates.find(u => u.id === p.id) || p));
    await refreshStockAdjustments();
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
  /**
   * Stock movements are recorded by the API in the same transaction as the
   * stock change itself, so the client cannot invent ledger entries — it only
   * re-reads what the server wrote.
   */
  const refreshStockAdjustments = () => loadStockAdjustments(activeBranchId);

  /** Explicit intake / write-off. */
  const adjustStock = async ({ productId, delta, reason }) => {
    const { product } = await inventoryAPI.createStockAdjustment({
      productId, delta, reason, branchId: activeBranchId,
    });
    const normalized = normalizeProduct(product);
    setProducts(prev => prev.map(p => (p.id === normalized.id ? normalized : p)));
    await refreshStockAdjustments();
    return normalized;
  };

  // Add Sale Workflow
  const addSale = async (saleData) => {
    const saved = await saleAPI.create({
      ...saleData,
      branchId: activeBranchId,
      branchName: activeBranch?.name || '',
      posTerminalId: saleData.posTerminalId || 'web-pos',
      cashierId: saleData.cashierId || currentUser?.uid,
      cashierName: saleData.cashierName || saleData.employeeName || currentUser?.displayName || currentUser?.email,
      cashierRole: saleData.cashierRole || currentUser?.role || 'Employee',
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

    // Loyalty totals are recalculated by the API as part of the sale
    // transaction; re-read them rather than keeping a local guess that would
    // drift from the recorded revenue.
    if (saleData.customerId) {
      loadCustomers();
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
  const addCustomer = async (customerData) => {
    const { customer } = await customerAPI.create(customerData);
    const normalized = normalizeCustomer(customer);
    setCustomers(prev => [normalized, ...prev]);
    logActivity(`Added Customer: ${normalized.name}`);
    addNotification('Customer Added', `${normalized.name} was saved to your customer list.`, 'success');
    return normalized;
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

  /**
   * Activity history is written server-side to the audit log as a side effect
   * of the mutation itself. Keeping a parallel client-side list produced a
   * second, unverifiable history, so this only tracks the current session for
   * immediate feedback.
   */
  const logActivity = (text) => {
    setActivities(prev => [
      { id: `act_${Date.now()}`, time: 'Just now', user: currentUser?.displayName || 'Active User', text },
      ...prev,
    ].slice(0, 50));
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
      refreshBranches,
      refreshWorkspaceData,
      dataStatus,
      dataError,
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
      adjustStock,
      refreshStockAdjustments,
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
