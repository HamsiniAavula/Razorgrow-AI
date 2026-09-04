import React, { useState } from 'react';
import { ShoppingBag, Search, Sparkles, Star, Tag, Check } from 'lucide-react';

export default function CatalogView({ products = [], onSelectProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShoppingBag size={24} color="#0284c7" />
            <span>Store Products</span>
          </h1>
          <p className="page-subtitle">
            Catalog inventory available for AI conversational shopping and personalized bounded upsells.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '240px'
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff'
            }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {filtered.map(product => (
          <div key={product.id} className="rec-card">
            <img
              src={product.image}
              alt={product.name}
              className="rec-card-img"
            />
            <div className="rec-card-body">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                    {product.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span>{product.rating}</span>
                  </div>
                </div>

                <div className="rec-title">{product.name}</div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', minHeight: '36px' }}>
                  {product.description}
                </p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div className="rec-price">₹{product.price.toLocaleString('en-IN')}</div>
                  <span style={{ fontSize: '0.75rem', color: product.stock > 5 ? '#059669' : '#d97706', fontWeight: 600 }}>
                    {product.stock} in stock
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
                  onClick={() => onSelectProduct(product)}
                >
                  <Sparkles size={14} />
                  <span>Choose with AI Upsell</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
