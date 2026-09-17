'use client';

import React, { useState } from 'react';
import { Cpu, Fingerprint, Wifi, CheckCircle2, RefreshCw, Zap, RotateCcw } from 'lucide-react';

interface HardwareTestBarProps {
  onSimulateAccess: (compartment?: string) => Promise<void>;
  onResetDemo?: () => Promise<void>;
  onActivateWindow?: () => Promise<void>;
  nextDoseCompartment?: string;
  isWindowOpen?: boolean;
}

export default function HardwareTestBar({
  onSimulateAccess,
  onResetDemo,
  onActivateWindow,
  nextDoseCompartment = 'C01',
  isWindowOpen = true
}: HardwareTestBarProps) {
  const [triggering, setTriggering] = useState(false);
  const [activating, setActivating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleTrigger = async () => {
    setTriggering(true);
    setFeedback('Sending Biometric Pulse to /api/device...');
    try {
      await onSimulateAccess(nextDoseCompartment);
      setFeedback('Biometric Verified · Compartment ' + nextDoseCompartment + ' Unlocked & Synced.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback('Access failed: ' + (e.message || 'Error'));
    } finally {
      setTriggering(false);
    }
  };

  const handleActivate = async () => {
    if (!onActivateWindow) return;
    setActivating(true);
    try {
      await onActivateWindow();
      setFeedback('Next dose window opened for Biometric verification!');
      setTimeout(() => setFeedback(null), 3500);
    } catch (e: any) {
      setFeedback('Activation note: ' + (e.message || 'Error'));
    } finally {
      setActivating(false);
    }
  };

  const handleReset = async () => {
    if (!onResetDemo) return;
    if (!confirm('Reset demo state to pristine initial schedule & biometric logs?')) return;
    setResetting(true);
    try {
      await onResetDemo();
      setFeedback('Demo data reset to clinical seed state.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (e: any) {
      setFeedback('Reset note: ' + (e.message || 'Error'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-subtle)',
      borderBottom: '1px solid var(--border-stone)',
      padding: '7px 24px',
      fontSize: 12.5,
      color: 'var(--text-slate)'
    }}>
      <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10
      }}>
        {/* Hardware Status Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-ink)', fontWeight: 600 }}>
            <Cpu size={14} color="var(--text-slate)" />
            <span>ESP32 Hardware Bridge</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={13} color="var(--color-forest)" />
            <span>Node:</span>
            <code style={{
              background: '#ffffff',
              border: '1px solid var(--border-stone)',
              padding: '1px 6px',
              borderRadius: 4,
              color: 'var(--text-ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11
            }}>
              ESP32_01
            </code>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-stone)' }}>Dispenser:</span>
            <span className={`badge ${isWindowOpen ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
              {isWindowOpen ? `Compartment ${nextDoseCompartment} (Armed)` : 'Compartments Locked'}
            </span>
          </div>
        </div>

        {/* Action Buttons & Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {feedback && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--color-forest)',
              fontSize: 11.5,
              fontWeight: 500,
              background: 'var(--color-forest-bg)',
              padding: '3px 10px',
              borderRadius: 9999,
              border: '1px solid var(--color-forest-border)'
            }}>
              <CheckCircle2 size={13} />
              <span>{feedback}</span>
            </div>
          )}

          {/* Quick open window for live demo */}
          {onActivateWindow && (
            <button
              onClick={handleActivate}
              disabled={activating}
              title="Immediately opens the dose window for live presentation"
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-stone)',
                color: 'var(--text-slate)',
                padding: '4px 10px',
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 11,
                cursor: activating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Zap size={12} color="var(--color-ochre)" />
              <span>{activating ? 'Arming...' : 'Arm Next Dose Window'}</span>
            </button>
          )}

          {/* Main simulate scan button */}
          <button
            onClick={handleTrigger}
            disabled={triggering}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-stone)',
              color: 'var(--text-ink)',
              padding: '4px 12px',
              borderRadius: 9999,
              fontWeight: 600,
              fontSize: 11.5,
              cursor: triggering ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.16s ease'
            }}
          >
            {triggering ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Fingerprint size={13} color="var(--color-forest)" />
            )}
            <span>Send Biometric Pulse (Simulate Scan)</span>
          </button>

          {/* Reset Demo Seed button */}
          {onResetDemo && (
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset sample schedule & compliance logs back to initial state"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-stone)',
                padding: '4px 6px',
                cursor: resetting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11
              }}
            >
              <RotateCcw size={12} className={resetting ? 'animate-spin' : ''} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
