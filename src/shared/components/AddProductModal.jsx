import React, { useState } from 'react';
import { X, Upload, Trash2, Star, ArrowLeft, ArrowRight, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useMultiTenant } from '../../core/tenant/MultiTenantContext';
import { useLanguage } from '../../localization/LanguageContext';

export default function AddProductModal({ isOpen, onClose }) {
  const { addProduct } = useMultiTenant();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: 'Premium Velvet Matte Lipstick',
    sku: `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
    barcode: `${Math.floor(Math.random() * 899999999999 + 100000000000)}`,
    category: 'Makeup',
    brand: 'Gurey Group',
    supplierId: 'sup_luxe_cosmetics',
    costPrice: '12.00',
    sellingPrice: '35.00',
    quantity: '50',
    unit: 'pcs',
    lowStockLevel: '15',
    reorderLevel: '30',
    batchNumber: 'BT-2026-08',
    expiryDate: '2028-08-01',
    notes: 'Premium velvet matte formulation.'
  });

  // Manual Multi-Image State
  const [images, setImages] = useState([
    { id: '1', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80', isPrimary: true }
  ]);
  const [manualUrl, setManualUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Image Upload Handlers
  const handleFiles = (files) => {
    const fileList = Array.from(files);
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => {
          const isFirst = prev.length === 0;
          return [...prev, {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            url: e.target.result,
            isPrimary: isFirst
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    setImages(prev => {
      const isFirst = prev.length === 0;
      return [...prev, {
        id: `img_${Date.now()}`,
        url: manualUrl.trim(),
        isPrimary: isFirst
      }];
    });
    setManualUrl('');
  };

  const setPrimary = (id) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
  };

  const deleteImage = (id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('Please upload at least one product image.');
      return;
    }

    const orderedImages = [
      ...images.filter(img => img.isPrimary).map(img => img.url),
      ...images.filter(img => !img.isPrimary).map(img => img.url)
    ];

    addProduct({
      ...formData,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      quantity: parseInt(formData.quantity, 10),
      lowStockLevel: parseInt(formData.lowStockLevel, 10),
      reorderLevel: parseInt(formData.reorderLevel, 10),
      images: orderedImages
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl glass-panel rounded-4xl p-6 sm:p-8 relative shadow-2xl border border-white/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 max-h-[90vh] overflow-y-auto animate-fade-scale">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors btn-micro"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center text-center space-y-4 animate-fade-scale">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center border border-emerald-300">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('toasts.product_added', 'Product Added to Inventory!')}</h3>
            <p className="text-sm font-medium text-slate-500">
              <span className="font-bold text-slate-900 dark:text-white">{formData.name}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-500">
                {t('products.catalog_title', 'Products Catalog')}
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {t('products.add_product', 'Add New Product')}
              </h3>
            </div>

            {/* MANUAL MULTI-IMAGE UPLOADER SECTION */}
            <div className="space-y-3 p-4 rounded-3xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-500" /> Manual Product Image Management
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {images.length} Image(s) Attached
                </span>
              </div>

              {/* Drag & Drop Zone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white/50 dark:bg-slate-900/50'
                }`}
              >
                <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drag & Drop product images here, or{' '}
                  <label className="text-indigo-600 dark:text-indigo-400 cursor-pointer underline hover:text-indigo-500">
                    browse files
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={(e) => handleFiles(e.target.files)} 
                      className="hidden" 
                    />
                  </label>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, WEBP • Multiple Image Upload</p>
              </div>

              {/* Image URL Paste Fallback */}
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Or paste direct image URL..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold hover:scale-105 transition-all btn-micro"
                >
                  {t('common.add', 'Add URL')}
                </button>
              </div>

              {/* Image Preview & Reordering Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((img, index) => (
                    <div key={img.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-square animate-fade-in-up">
                      <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                      
                      {/* Primary Thumbnail Badge */}
                      {img.isPrimary ? (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black shadow-md flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" /> Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimary(img.id)}
                          className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-amber-500 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set Primary
                        </button>
                      )}

                      {/* Reorder & Delete Overlay */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveImage(index, -1)}
                          className="w-6 h-6 rounded-lg bg-white/20 text-white hover:bg-white/40 flex items-center justify-center disabled:opacity-30 btn-micro"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteImage(img.id)}
                          className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors btn-micro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={index === images.length - 1}
                          onClick={() => moveImage(index, 1)}
                          className="w-6 h-6 rounded-lg bg-white/20 text-white hover:bg-white/40 flex items-center justify-center disabled:opacity-30 btn-micro"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Metadata Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.product_name', 'Product Name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.sku', 'SKU')}</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.category', 'Category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                >
                  <option value="Makeup">Makeup</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Fragrance">Fragrance</option>
                  <option value="Haircare">Haircare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.cost', 'Cost Price')} ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.price', 'Selling Price')} ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.stock_quantity', 'Stock Quantity')}</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.batch_no', 'Batch Number')}</label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">{t('products.exp_date', 'Expiry Date')}</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-sm shadow-xl hover:scale-[1.01] transition-all btn-micro"
            >
              {t('products.save_product', 'Save Product')}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
