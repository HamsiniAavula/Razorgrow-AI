import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ReplanningModal({ isOpen, onClose, onApproveUpsell }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [replanData, setReplanData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRunReplan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/replanning-scenario', { method: 'POST' });
      const data = await res.json();
      setReplanData(data);
      setCurrentStep(4);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#0c2340', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#38bdf8" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'white' }}>
              Agentic Re-planning Demo (Failure & Recovery)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
            Demonstrating Section 11 of the specification: The AI proposes an upsell, the Policy Engine rejects it, the agent observes the constraint violation, re-plans, and proposes a policy-compliant alternative.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Step 1: Initial AI Proposal */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase' }}>
                  Step 1: Autonomous Proposal
                </span>
                <span className="badge badge-ai">Agent Output</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                Premium Gift Box (₹899)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                AI proposed a luxury packaging upgrade for Classic Watch.
              </div>
            </div>

            {/* Step 2: Policy Engine Rejection */}
            <div style={{
              background: '#fef2f2',
              border: '1.5px solid #fca5a5',
              borderRadius: '10px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#dc2626', textTransform: 'uppercase' }}>
                  Step 2: Deterministic Policy Check
                </span>
                <span className="badge badge-failed">BLOCKED</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991b1b' }}>
                Exceeds Maximum Upsell Limit (₹899 &gt; ₹500 cap)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.2rem' }}>
                Merchant Policy Rule #2: Max upsell amount allowed is ₹500. Action prohibited.
              </div>
            </div>

            {/* Step 3: Replanning Action */}
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '10px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Step 3: Autonomous Re-planning Loop
                </span>
                <span className="badge badge-paid">Agent Responding</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.5 }}>
                Agent analyzes policy feedback: "Candidate exceeds ₹500 ceiling." Agent filters catalog for accessories &le; ₹500 and selects <strong>Gift Packaging (₹199)</strong>.
              </div>
            </div>

            {/* Step 4: Policy Check on Alternative */}
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '10px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#15803d', textTransform: 'uppercase' }}>
                  Step 4: Policy Check on Replanned SKU
                </span>
                <span className="badge badge-paid">ALLOWED</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#166534' }}>
                Gift Packaging (₹199 &le; ₹500 cap)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>
                Safety checks passed. Customer approval requested.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-success"
            onClick={() => {
              onApproveUpsell({
                id: 'prod_packaging',
                name: 'Gift Packaging',
                price: 199,
                image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60'
              });
              onClose();
            }}
          >
            <CheckCircle2 size={16} />
            <span>Approve Replanned Upsell (+₹199)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
