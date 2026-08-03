// Comprehensive Enterprise Multi-Tenant Mock Dataset for Gurey Group Management System

export const initialCompanies = [
  {
    id: 'comp_gurey_main',
    name: 'Gurey Group HQ',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=150&q=80',
    businessType: 'Retail & Wholesale',
    country: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    taxRate: 8.5,
    plan: 'Professional',
    branches: ['branch_ny_soho', 'branch_la_beverly'],
    warehouses: ['wh_central_nj'],
  },
  {
    id: 'comp_glow_boutique',
    name: 'Glow Beauty Boutique',
    logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=150&q=80',
    businessType: 'Boutique Salon',
    country: 'Kenya',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'Africa/Nairobi',
    taxRate: 16.0,
    plan: 'Starter',
    branches: ['branch_nairobi_cbd'],
    warehouses: [],
  }
];

export const initialBranches = [
  { id: 'branch_ny_soho', companyId: 'comp_gurey_main', name: 'SoHo Flagship Store', code: 'BR-NY01', city: 'New York', phone: '+1 (212) 555-0192', manager: 'Elena Rostova', isActive: true },
  { id: 'branch_la_beverly', companyId: 'comp_gurey_main', name: 'Beverly Hills Store', code: 'BR-LA02', city: 'Los Angeles', phone: '+1 (310) 555-0144', manager: 'Charles Leclerc', isActive: true },
  { id: 'branch_nairobi_cbd', companyId: 'comp_glow_boutique', name: 'Nairobi CBD Branch', code: 'BR-NBO1', city: 'Nairobi', phone: '+254 712 345 678', manager: 'Maya Naira', isActive: true }
];

export const initialWarehouses = [
  { id: 'wh_central_nj', companyId: 'comp_gurey_main', name: 'Central Logistics Warehouse', code: 'WH-NJ01', location: 'New Jersey Depot', capacity: '15,000 Units', manager: 'Fernando Alonso' }
];

export const initialProducts = [
  {
    id: 'prod_gurey_01',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    name: 'Premium Velvet Matte Lipstick #220 (Rose Dust)',
    sku: 'VEL-LIP-220',
    barcode: '859012344012',
    qrCode: 'QR-VEL-220',
    category: 'Makeup',
    brand: 'Gurey Group',
    supplierId: 'sup_luxe_cosmetics',
    supplierName: 'Luxe Cosmetics Lab Paris',
    costPrice: 8.50,
    sellingPrice: 28.00,
    profitMargin: 69.6,
    discount: 0,
    taxRate: 8.5,
    quantity: 142,
    unit: 'pcs',
    lowStockLevel: 25,
    reorderLevel: 50,
    batchNumber: 'BT-2026-08A',
    manufactureDate: '2026-01-15',
    expiryDate: '2028-01-15',
    status: 'In Stock',
    images: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=400&q=80'
    ],
    variants: [
      { id: 'var_220', name: 'Rose Dust #220', sku: 'VEL-LIP-220', stock: 142 },
      { id: 'var_221', name: 'Ruby Crimson #221', sku: 'VEL-LIP-221', stock: 85 }
    ],
    notes: 'Bestseller in European and US retail outlets.'
  },
  {
    id: 'prod_gurey_02',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    name: 'Radiance Hydra-Serum with Hyaluronic Acid 50ml',
    sku: 'VEL-SER-050',
    barcode: '859012344019',
    qrCode: 'QR-VEL-050',
    category: 'Skincare',
    brand: 'Glow Botanical',
    supplierId: 'sup_bio_dermal',
    supplierName: 'BioDermal Labs Switzerland',
    costPrice: 14.00,
    sellingPrice: 45.00,
    profitMargin: 68.8,
    discount: 5.0,
    taxRate: 8.5,
    quantity: 18,
    unit: 'bottles',
    lowStockLevel: 20,
    reorderLevel: 40,
    batchNumber: 'BT-2026-04C',
    manufactureDate: '2025-11-10',
    expiryDate: '2027-11-10',
    status: 'Low Stock',
    images: [
      'https://images.unsplash.com/photo-1608248597263-000796df9c11?auto=format&fit=crop&w=400&q=80'
    ],
    variants: [],
    notes: 'Reorder triggered automatically.'
  },
  {
    id: 'prod_gurey_03',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    name: 'Midnight Silk Eau de Parfum 100ml',
    sku: 'VEL-PRF-100',
    barcode: '859012344026',
    qrCode: 'QR-VEL-100',
    category: 'Fragrance',
    brand: 'Maison de Gurey',
    supplierId: 'sup_luxe_cosmetics',
    supplierName: 'Luxe Cosmetics Lab Paris',
    costPrice: 32.00,
    sellingPrice: 95.00,
    profitMargin: 66.3,
    discount: 0,
    taxRate: 8.5,
    quantity: 64,
    unit: 'bottles',
    lowStockLevel: 15,
    reorderLevel: 30,
    batchNumber: 'BT-2026-02F',
    manufactureDate: '2026-02-01',
    expiryDate: '2030-02-01',
    status: 'In Stock',
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80'
    ],
    variants: [],
    notes: 'Premium luxury line item.'
  },
  {
    id: 'prod_gurey_04',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    name: 'Organic Argan Hair Repair Treatment 250ml',
    sku: 'VEL-HAR-250',
    barcode: '859012344033',
    qrCode: 'QR-VEL-250',
    category: 'Haircare',
    brand: 'Naturals Co',
    supplierId: 'sup_bio_dermal',
    supplierName: 'BioDermal Labs Switzerland',
    costPrice: 7.20,
    sellingPrice: 22.50,
    profitMargin: 68.0,
    discount: 0,
    taxRate: 8.5,
    quantity: 0,
    unit: 'tubes',
    lowStockLevel: 10,
    reorderLevel: 20,
    batchNumber: 'BT-2025-12K',
    manufactureDate: '2025-12-01',
    expiryDate: '2027-12-01',
    status: 'Out of Stock',
    images: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80'
    ],
    variants: [],
    notes: 'Restock shipment in transit from supplier.'
  },
  {
    id: 'prod_gurey_05',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    name: 'Organic SPF 50 Mineral Sunscreen Gel 100ml',
    sku: 'VEL-SUN-050',
    barcode: '859012344040',
    qrCode: 'QR-VEL-040',
    category: 'Skincare',
    brand: 'Glow Botanical',
    supplierId: 'sup_bio_dermal',
    supplierName: 'BioDermal Labs Switzerland',
    costPrice: 9.50,
    sellingPrice: 32.00,
    profitMargin: 70.3,
    discount: 15.0,
    taxRate: 8.5,
    quantity: 45,
    unit: 'tubes',
    lowStockLevel: 15,
    reorderLevel: 30,
    batchNumber: 'BT-2025-09S',
    manufactureDate: '2024-09-01',
    expiryDate: '2026-08-25',
    status: 'In Stock',
    images: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80'
    ],
    variants: [],
    notes: 'Expiring soon - clear on discount.'
  },
  {
    id: 'prod_gurey_06',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    name: 'Rose Quartz Sculpting Facial Roller Tool',
    sku: 'VEL-ACC-001',
    barcode: '859012344057',
    qrCode: 'QR-VEL-057',
    category: 'Makeup',
    brand: 'Gurey Group',
    supplierId: 'sup_luxe_cosmetics',
    supplierName: 'Luxe Cosmetics Lab Paris',
    costPrice: 12.00,
    sellingPrice: 38.00,
    profitMargin: 68.4,
    discount: 0,
    taxRate: 8.5,
    quantity: 88,
    unit: 'pcs',
    lowStockLevel: 10,
    reorderLevel: 20,
    batchNumber: 'BT-2025-01R',
    manufactureDate: '2025-01-10',
    expiryDate: '2030-01-10',
    status: 'In Stock',
    images: [
      'https://images.unsplash.com/photo-1512290900676-26c2a4ed40fa?auto=format&fit=crop&w=400&q=80'
    ],
    variants: [],
    notes: 'Slow moving accessory stock.'
  }
];

export const initialSales = [
  {
    id: 'sale_1001',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    receiptNumber: 'REC-2026-0801',
    customerName: 'Sophia Loren',
    customerEmail: 'sophia@example.com',
    items: [
      { productId: 'prod_gurey_01', productName: 'Premium Velvet Matte Lipstick #220', quantity: 2, price: 28.00, total: 56.00 },
      { productId: 'prod_gurey_03', productName: 'Midnight Silk Eau de Parfum 100ml', quantity: 1, price: 95.00, total: 95.00 }
    ],
    subtotal: 151.00,
    tax: 12.84,
    discount: 0,
    total: 163.84,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    employeeName: 'Ahmed Cashier',
    date: '2026-08-03T02:45:00Z',
    formattedDate: 'Today, 02:45 AM'
  },
  {
    id: 'sale_1002',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    receiptNumber: 'REC-2026-0802',
    customerName: 'Amira Hassan',
    customerEmail: 'amira@example.com',
    items: [
      { productId: 'prod_gurey_02', productName: 'Radiance Hydra-Serum 50ml', quantity: 1, price: 42.75, total: 42.75 }
    ],
    subtotal: 42.75,
    tax: 3.63,
    discount: 2.25,
    total: 46.38,
    paymentMethod: 'Mobile Money',
    paymentStatus: 'Paid',
    employeeName: 'Fatima Manager',
    date: '2026-08-02T16:20:00Z',
    formattedDate: 'Yesterday, 04:20 PM'
  },
  {
    id: 'sale_1003',
    companyId: 'comp_gurey_main',
    branchId: 'branch_ny_soho',
    receiptNumber: 'REC-2026-0803',
    customerName: 'Walk-in Customer',
    customerEmail: 'walkin@gureygroup.com',
    items: [
      { productId: 'prod_gurey_01', productName: 'Premium Velvet Matte Lipstick #220', quantity: 1, price: 28.00, total: 28.00 }
    ],
    subtotal: 28.00,
    tax: 2.38,
    discount: 0,
    total: 30.38,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    employeeName: 'Ahmed Cashier',
    date: '2026-08-02T11:15:00Z',
    formattedDate: 'Yesterday, 11:15 AM'
  }
];

export const initialPurchaseOrders = [
  {
    id: 'po_901',
    companyId: 'comp_gurey_main',
    poNumber: 'PO-2026-004',
    supplierName: 'Luxe Cosmetics Lab Paris',
    contactPerson: 'Jean-Luc Moreau',
    date: 'Today',
    expectedDelivery: 'Aug 08, 2026',
    category: 'Restock Batch',
    status: 'In Transit',
    statusColor: 'bg-blue-500 text-white',
    amount: '$4,250.00',
    itemsCount: 150
  },
  {
    id: 'po_902',
    companyId: 'comp_gurey_main',
    poNumber: 'PO-2026-003',
    supplierName: 'BioDermal Labs Switzerland',
    contactPerson: 'Dr. Clara Weiss',
    date: 'Aug 01',
    expectedDelivery: 'Aug 05, 2026',
    category: 'Serum Line',
    status: 'Pending Receipt',
    statusColor: 'bg-amber-500 text-white',
    amount: '$2,180.00',
    itemsCount: 60
  },
  {
    id: 'po_903',
    companyId: 'comp_gurey_main',
    poNumber: 'PO-2026-002',
    supplierName: 'Naturals Co Organic',
    contactPerson: 'Marco Rossi',
    date: 'Jul 24',
    expectedDelivery: 'Aug 02, 2026',
    category: 'Haircare Line',
    status: 'Delivered',
    statusColor: 'bg-emerald-500 text-white',
    amount: '$1,950.00',
    itemsCount: 80
  }
];

export const initialSuppliers = [
  {
    id: 'sup_luxe_cosmetics',
    companyId: 'comp_gurey_main',
    companyName: 'Luxe Cosmetics Lab Paris',
    contactPerson: 'Jean-Luc Moreau',
    phone: '+33 1 42 68 55 00',
    email: 'contact@luxecosmetics.fr',
    address: '14 Rue de la Paix, 75002 Paris, France',
    productsSupplied: 'Lipsticks, Perfumes, Premium Compacts',
    outstandingBalance: '$1,200.00',
    creditTerms: 'Net 30'
  },
  {
    id: 'sup_bio_dermal',
    companyId: 'comp_gurey_main',
    companyName: 'BioDermal Labs Switzerland',
    contactPerson: 'Dr. Clara Weiss',
    phone: '+41 22 819 3000',
    email: 'orders@biodermal.ch',
    address: 'Avenue de France 22, 1202 Geneva, Switzerland',
    productsSupplied: 'Serums, anti-aging creams, organic oils',
    outstandingBalance: '$0.00',
    creditTerms: 'Net 15'
  }
];

export const initialCustomers = [
  {
    id: 'cust_01',
    companyId: 'comp_gurey_main',
    name: 'Sophia Loren',
    phone: '+1 (212) 890-1234',
    email: 'sophia@example.com',
    group: 'VIP Member',
    loyaltyPoints: 480,
    totalSpent: '$1,420.00',
    outstandingBalance: '$0.00',
    lastPurchase: 'Today'
  },
  {
    id: 'cust_02',
    companyId: 'comp_gurey_main',
    name: 'Amira Hassan',
    phone: '+1 (310) 456-7890',
    email: 'amira@example.com',
    group: 'Regular Retail',
    loyaltyPoints: 120,
    totalSpent: '$345.50',
    outstandingBalance: '$0.00',
    lastPurchase: 'Yesterday'
  }
];

export const initialEmployees = [
  {
    id: 'emp_01',
    companyId: 'comp_gurey_main',
    name: 'Fernando Alonso',
    role: 'Owner',
    email: 'fernando@gureygroup.com',
    phone: '+1 (212) 555-0100',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    badge: 'Owner'
  },
  {
    id: 'emp_02',
    companyId: 'comp_gurey_main',
    name: 'Charles Leclerc',
    role: 'Admin / Store Manager',
    email: 'charles@gureygroup.com',
    phone: '+1 (212) 555-0101',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    badge: 'Admin'
  },
  {
    id: 'emp_03',
    companyId: 'comp_gurey_main',
    name: 'Maya Naira',
    role: 'Inventory Manager',
    email: 'maya@gureygroup.com',
    phone: '+1 (212) 555-0102',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    badge: 'Inventory'
  },
  {
    id: 'emp_04',
    companyId: 'comp_gurey_main',
    name: 'Ahmed Cashier',
    role: 'POS Cashier',
    email: 'ahmed@gureygroup.com',
    phone: '+1 (212) 555-0103',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    badge: 'Cashier'
  }
];

export const initialActivities = [
  { id: 'act_1', time: '10 mins ago', user: 'Ahmed Cashier', text: 'Completed Sale REC-2026-0801 ($163.84) via Card' },
  { id: 'act_2', time: '1 hour ago', user: 'Maya Naira', text: 'Updated inventory for Hydrating Serum (+20 bottles)' },
  { id: 'act_3', time: '3 hours ago', user: 'Charles Leclerc', text: 'Created Purchase Order PO-2026-004 to Luxe Cosmetics' },
  { id: 'act_4', time: 'Yesterday', user: 'Fernando Alonso', text: 'Configured Soho Branch tax rate to 8.5%' }
];

export const initialStockAdjustments = [
  { id: 'adj_101', companyId: 'comp_gurey_main', productId: 'prod_gurey_02', productName: 'Radiance Hydra-Serum with Hyaluronic Acid 50ml', sku: 'VEL-SER-050', delta: 20, reason: 'Supplier Restock', timestamp: '2026-08-03T14:10:00Z', user: 'Maya Naira' },
  { id: 'adj_102', companyId: 'comp_gurey_main', productId: 'prod_gurey_04', productName: 'Organic Argan Hair Repair Treatment 250ml', sku: 'VEL-HAR-250', delta: -2, reason: 'Damaged / Tester', timestamp: '2026-08-02T11:00:00Z', user: 'Charles Leclerc' },
  { id: 'adj_103', companyId: 'comp_gurey_main', productId: 'prod_gurey_01', productName: 'Premium Velvet Matte Lipstick #220', sku: 'VEL-LIP-220', delta: 50, reason: 'Inventory Audit Intake', timestamp: '2026-08-01T09:30:00Z', user: 'Fernando Alonso' }
];

export const initialNotifications = [
  { id: 'notif_1', title: 'Low Stock Alert', message: 'Radiance Hydra-Serum (18 units) has dropped below threshold (20 units).', type: 'warning', timestamp: '10 mins ago', isRead: false },
  { id: 'notif_2', title: 'Product Expiring Soon', message: 'Organic Botanical Sunscreen Batch BT-2025-09 expires in 28 days.', type: 'error', timestamp: '1 hour ago', isRead: false },
  { id: 'notif_3', title: 'PO Shipment Dispatched', message: 'PO-2026-004 from Luxe Cosmetics Lab Paris is in transit.', type: 'info', timestamp: '3 hours ago', isRead: true }
];

