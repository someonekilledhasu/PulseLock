'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  Check, 
  Clock, 
  Calendar, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParsedPrescriptionAI } from '@/lib/types';

interface ConfirmationScreenProps {
  parsedData: ParsedPrescriptionAI;
  onConfirmSuccess: () => void;
  onBackToEdit: () => void;
}

export default function ConfirmationScreen({
  parsedData,
  onConfirmSuccess,
  onBackToEdit
}: ConfirmationScreenProps) {
  const [formData, setFormData] = useState<ParsedPrescriptionAI>(parsedData);
  const [isEditing, setIsEditing] = useState(false);
  const [compartmentId, setCompartmentId] = useState('C01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setFormData(parsedData);
  }, [parsedData]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '00000000-0000-0000-0000-000000000001',
          medication: {
            name: formData.medicine,
            strength: formData.strength,
            dose_amount: formData.dose,
            dose_unit: 'tablet',
            frequency: formData.frequency,
            scheduled_times: formData.times,
            food_instruction: formData.food,
            duration_days: formData.duration_days,
            compartment_id: compartmentId,
            color: '#2563eb'
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate prescription');
      }

      // Subtle confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      onConfirmSuccess();
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const totalDoses = (formData.times?.length || 2) * (formData.duration_days || 30);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-forest-bg)',
          color: 'var(--color-forest)',
          border: '1px solid var(--color-forest-border)',
          padding: '4px 12px',
          borderRadius: 9999,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 10,
          letterSpacing: 0.3
        }}>
          <ShieldCheck size={13} />
          <span>SAFETY CHECK · PATIENT CONFIRMATION REQUIRED</span>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, color: 'var(--text-ink)' }}>
          Review Prescription
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-slate)', marginTop: 4 }}>
          Please verify the structured prescription before PulseLock generates your schedule.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-rose-bg)',
          border: '1px solid var(--color-rose-border)',
          color: 'var(--color-rose)',
          padding: '12px 16px',
          borderRadius: 12,
          fontSize: 13,
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      {/* Review Card */}
      <div className="stone-card" style={{ padding: '36px', marginBottom: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-stone)',
          paddingBottom: 18,
          marginBottom: 20
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-stone)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
              Medication
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-ink)', marginTop: 4 }}>
              {isEditing ? (
                <input
                  value={formData.medicine}
                  onChange={(e) => setFormData({ ...formData, medicine: e.target.value })}
                  style={{ fontSize: 18, fontWeight: 700, padding: '4px 8px' }}
                />
              ) : (
                formData.medicine
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-stone)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
              Strength
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-ink)', marginTop: 4 }}>
              {isEditing ? (
                <input
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  style={{ fontSize: 15, width: 110, padding: '4px 8px' }}
                />
              ) : (
                formData.strength
              )}
            </div>
          </div>
        </div>

        {/* Spec Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 22
        }}>
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            borderRadius: 12,
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>Dose Quantity</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-ink)', marginTop: 2 }}>
              {isEditing ? (
                <input
                  value={formData.dose}
                  onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                />
              ) : (
                formData.dose
              )}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            borderRadius: 12,
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>Frequency</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-ink)', marginTop: 2 }}>
              {isEditing ? (
                <input
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                />
              ) : (
                formData.frequency
              )}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            borderRadius: 12,
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>Scheduled Times</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-ink)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="var(--text-slate)" />
              {isEditing ? (
                <input
                  value={formData.times.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    times: e.target.value.split(',').map(t => t.trim())
                  })}
                />
              ) : (
                formData.times.join(' & ')
              )}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            borderRadius: 12,
            padding: '12px 16px'
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>Food Instruction</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-ink)', marginTop: 2 }}>
              {isEditing ? (
                <input
                  value={formData.food}
                  onChange={(e) => setFormData({ ...formData, food: e.target.value })}
                />
              ) : (
                formData.food
              )}
            </div>
          </div>
        </div>

        {/* Schedule Generation Note */}
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-stone)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 22
        }}>
          <Calendar size={18} color="var(--text-slate)" />
          <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-slate)' }}>
            <strong style={{ color: 'var(--text-ink)' }}>Schedule Generation:</strong> {formData.duration_days} days × {formData.times.length} doses/day ={' '}
            <span style={{ color: 'var(--text-ink)', fontWeight: 700 }}>{totalDoses} total doses</span> will be created and linked to your PulseLock dispenser.
          </div>
        </div>

        {/* Compartment Selection */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-stone)', display: 'block', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Assign to Dispenser Compartment:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['C01', 'C02'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCompartmentId(c)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: compartmentId === c ? '2px solid var(--text-ink)' : '1px solid var(--border-stone)',
                  background: compartmentId === c ? 'var(--bg-subtle)' : '#ffffff',
                  color: 'var(--text-ink)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.16s ease'
                }}
              >
                <span>Compartment {c}</span>
                {compartmentId === c && <CheckCircle2 size={16} color="var(--color-forest)" />}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
          >
            <Edit3 size={14} />
            <span>{isEditing ? 'Save Changes' : 'Edit Details'}</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary"
            style={{
              background: 'var(--color-forest)',
              borderColor: 'var(--color-forest)'
            }}
          >
            <Check size={16} />
            <span>{loading ? 'Activating Schedule...' : 'Confirm Prescription & Arm Locks'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
