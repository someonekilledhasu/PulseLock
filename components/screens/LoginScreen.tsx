'use client';

import React, { useState } from 'react';
import { Lock, UserCheck, AlertCircle, ArrowRight, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; username: string; fullName: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (pinToSubmit = pin) => {
    if (pinToSubmit.length < 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = mode === 'login' 
        ? { action: 'login', pin: pinToSubmit }
        : { 
            action: 'register', 
            fullName: fullName || 'Patient', 
            username: (fullName || 'patient').toLowerCase().replace(/\s+/g, '_'), 
            pin: pinToSubmit,
            phone 
          };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid PIN. Try demo PIN: 1234');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4 && mode === 'login') {
        handleSubmit(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div style={{
      minHeight: '84vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div className="stone-card" style={{
        width: '100%',
        maxWidth: 420,
        padding: '36px 32px',
        textAlign: 'center',
        background: '#ffffff'
      }}>
        {/* Emblem */}
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-stone)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--text-ink)'
        }}>
          <Lock size={20} />
        </div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.3,
          color: 'var(--text-ink)',
          marginBottom: 4
        }}>
          PulseLock
        </h1>
        <p style={{
          fontSize: 13,
          color: 'var(--text-slate)',
          marginBottom: 20
        }}>
          Connected Medication Adherence & Physical Access
        </p>

        {/* Mode Toggle */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-stone)',
          borderRadius: 9999,
          padding: 3,
          marginBottom: 20
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setPin(''); }}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? 'var(--text-ink)' : 'var(--text-slate)',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.16s ease'
            }}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); setPin(''); }}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? 'var(--text-ink)' : 'var(--text-slate)',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.16s ease'
            }}
          >
            <UserPlus size={13} />
            <span>New Patient</span>
          </button>
        </div>

        {/* Active Profile Card (In Login Mode) */}
        {mode === 'login' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            padding: '10px 14px',
            borderRadius: 14,
            marginBottom: 20,
            textAlign: 'left'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ffffff',
              border: '1px solid var(--border-stone)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--text-ink)'
            }}>
              AD
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-ink)' }}>
                Alex Davis
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>
                Patient ID: P001 · PulseLock Mini
              </div>
            </div>
            <UserCheck size={16} color="var(--color-forest)" />
          </div>
        ) : (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--text-slate)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Patient Full Name *
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
              />
            </div>
            <div>
              <label style={{ fontSize: 11.5, color: 'var(--text-slate)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Contact Phone (Optional)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2831"
              />
            </div>
          </div>
        )}

        {/* PIN Indicators */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11,
            color: 'var(--text-stone)',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 10,
            fontWeight: 600
          }}>
            {mode === 'login' ? 'Enter 4-Digit PIN' : 'Create 4-Digit Security PIN'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: filled ? 'var(--text-ink)' : 'var(--bg-subtle)',
                    border: '1px solid ' + (filled ? 'var(--text-ink)' : 'var(--border-stone)'),
                    transition: 'all 0.15s ease'
                  }}
                />
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: 'var(--color-rose)',
            fontSize: 12,
            marginBottom: 16,
            background: 'var(--color-rose-bg)',
            padding: '7px 12px',
            borderRadius: 8,
            border: '1px solid var(--color-rose-border)'
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Tactile Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          maxWidth: 240,
          margin: '0 auto 16px'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => {
            if (k === '') return <div key={i} />;
            return (
              <button
                key={i}
                type="button"
                onClick={() => (k === '⌫' ? handleBackspace() : handleKeypad(k))}
                disabled={loading}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid var(--border-stone)',
                  background: '#ffffff',
                  color: 'var(--text-ink)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.12s ease'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {k}
              </button>
            );
          })}
        </div>

        {/* Submit button for register mode */}
        {mode === 'register' && (
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || pin.length < 4 || !fullName}
            className="btn-primary"
            style={{ width: '100%', marginBottom: 12 }}
          >
            <span>Complete Registration</span>
            <ArrowRight size={14} />
          </button>
        )}

        {/* Quick Demo Assist Link */}
        {mode === 'login' && (
          <button
            onClick={() => {
              setPin('1234');
              handleSubmit('1234');
            }}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-slate)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Preset Demo Patient PIN (1234)</span>
          </button>
        )}

        <div style={{
          marginTop: 20,
          paddingTop: 14,
          borderTop: '1px solid var(--border-stone)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 11,
          color: 'var(--text-stone)'
        }}>
          <ShieldCheck size={13} color="var(--color-forest)" />
          <span>Biometric Access Control Layer Active</span>
        </div>
      </div>
    </div>
  );
}
