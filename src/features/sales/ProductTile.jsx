import React, { useState } from 'react';
import { Package, Plus } from 'lucide-react';

/** Shared catalogue presentation; stock and checkout decisions stay in POSScreen. */
export default function ProductTile({ product, onAdd, stockLabel='left', unavailableLabel='Out of stock' }) {
  const [failed,setFailed] = useState(false);
  const src=product.images?.[0];
  return <button type="button" className="pos-product-card commerce-tile" onClick={onAdd} disabled={product.quantity<=0}>
    <div className="commerce-tile__image">{src&&!failed?<img src={src} alt="" loading="lazy" onError={()=>setFailed(true)} />:<Package size={32} strokeWidth={1}/>}<span className="commerce-tile__add" aria-hidden="true"><Plus size={17}/></span></div>
    <div className="commerce-tile__identity"><h4>{product.name}</h4><span>SKU {product.sku}</span></div>
    <div className="commerce-tile__footer"><strong>${product.sellingPrice.toFixed(2)}</strong><span className={product.quantity<=product.lowStockLevel?'commerce-low':''}>{product.quantity<=0?unavailableLabel:`${product.quantity} ${stockLabel}`}</span></div>
  </button>;
}
