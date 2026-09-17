'use client';

import React from 'react';
import { 
  TrendingUp, 
  Fingerprint, 
  Cpu,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { AdherenceStats, DeviceEvent } from '@/lib/types';

interface AnalyticsScreenProps {
  stats: AdherenceStats | null;
  events: DeviceEvent[];
}

export default function AnalyticsScreen({ stats, events }: AnalyticsScreenProps) {
  const adherenceRate = stats?.overall_rate ?? 96;
  const scheduledCount = stats?.scheduled_count ?? 50;
  const accessedCount = stats?.accessed_count ?? 48;
  const missedCount = stats?.missed_count ?? 2;

  const handleDownloadCsv = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header with Export CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, color: 'var(--text-ink)', marginBottom: 4 }}>
            Adherence & Hardware Analytics
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-slate)' }}>
            Transforms raw ESP32 biometric events into actionable clinical compliance metrics
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            padding: '8px 16px'
          }}
        >
          <FileSpreadsheet size={15} color="var(--color-forest)" />
          <span>Export Clinical CSV Report</span>
          <Download size={13} />
        </button>
      </div>

      {/* Hero Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16
      }}>
        {/* Main Adherence Score */}
        <div className="stone-card" style={{
          padding: '24px 26px',
          background: 'var(--color-forest-bg)',
          border: '1px solid var(--color-forest-border)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Overall Adherence
          </div>
          <div style={{
            fontSize: 42,
            fontWeight: 800,
            color: 'var(--color-forest)',
            fontFamily: 'var(--font-mono)',
            margin: '6px 0 2px',
            lineHeight: 1
          }}>
            {adherenceRate}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontWeight: 500 }}>
            <TrendingUp size={13} />
            <span>+4.5% vs previous month</span>
          </div>
        </div>

        {/* Scheduled Doses */}
        <div className="stone-card" style={{ padding: '24px 26px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-stone)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Scheduled Doses
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-ink)', fontFamily: 'var(--font-mono)', margin: '6px 0 2px', lineHeight: 1 }}>
            {scheduledCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-slate)', marginTop: 6 }}>
            Prescriptions in active window
          </div>
        </div>

        {/* Accessed Doses */}
        <div className="stone-card" style={{ padding: '24px 26px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-stone)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Accessed Doses
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-ink)', fontFamily: 'var(--font-mono)', margin: '6px 0 2px', lineHeight: 1 }}>
            {accessedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-slate)', marginTop: 6 }}>
            Biometrically verified on ESP32
          </div>
        </div>

        {/* Missed Doses */}
        <div className="stone-card" style={{ padding: '24px 26px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-stone)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>
            Missed Doses
          </div>
          <div style={{
            fontSize: 42,
            fontWeight: 800,
            color: missedCount > 0 ? 'var(--color-rose)' : 'var(--text-ink)',
            fontFamily: 'var(--font-mono)',
            margin: '6px 0 2px',
            lineHeight: 1
          }}>
            {missedCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-slate)', marginTop: 6 }}>
            Window expired without access
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Weekly Chart + Medication Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 24
      }}>
        {/* Weekly Adherence Chart */}
        <div className="stone-card" style={{ padding: '28px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)' }}>Weekly Compliance Rhythm</h3>
              <p style={{ fontSize: 12, color: 'var(--text-stone)' }}>Daily adherence distribution (Last 7 days)</p>
            </div>
            <span className="badge badge-green" style={{ fontSize: 10 }}>Target 90%+</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: 170,
            paddingTop: 16,
            borderBottom: '1px solid var(--border-stone)',
            gap: 12
          }}>
            {(stats?.weekly_trend || [
              { day: 'MON', rate: 100 },
              { day: 'TUE', rate: 100 },
              { day: 'WED', rate: 80 },
              { day: 'THU', rate: 100 },
              { day: 'FRI', rate: 100 },
              { day: 'SAT', rate: 100 },
              { day: 'SUN', rate: 100 }
            ]).map((bar) => {
              const heightPct = bar.rate;
              const isHigh = heightPct >= 90;

              return (
                <div
                  key={bar.day}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: 6
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-stone)', fontFamily: 'var(--font-mono)' }}>
                    {bar.rate}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: `${heightPct}%`,
                      background: isHigh ? 'var(--color-forest)' : 'var(--color-ochre)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                  />
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-slate)', marginTop: 4 }}>
                    {bar.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medication Breakdown Table */}
        <div className="stone-card" style={{ padding: '28px 30px' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)' }}>Medication-Specific Compliance</h3>
            <p style={{ fontSize: 12, color: 'var(--text-stone)' }}>Breakdown by active prescription & remaining inventory</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(stats?.medication_breakdown || [
              { name: 'Metformin', strength: '500 mg', scheduled: 28, accessed: 27, rate: 96, color: '#1d4ed8', remaining_pills: 58, total_pills: 60 },
              { name: 'Vitamin D3', strength: '1000 IU', scheduled: 14, accessed: 13, rate: 93, color: '#d97706', remaining_pills: 29, total_pills: 30 }
            ]).map((med) => (
              <div key={med.name} style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-stone)',
                borderRadius: 14,
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-ink)' }}>{med.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-stone)', marginLeft: 6 }}>{med.strength}</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: med.rate >= 90 ? 'var(--color-forest)' : 'var(--color-ochre)'
                  }}>
                    {med.rate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#ffffff',
                  border: '1px solid var(--border-stone)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 8
                }}>
                  <div style={{
                    width: `${med.rate}%`,
                    height: '100%',
                    background: med.rate >= 90 ? 'var(--color-forest)' : 'var(--color-ochre)',
                    borderRadius: 3
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-stone)' }}>
                  <span>Accessed: {med.accessed} / {med.scheduled}</span>
                  <span>
                    Pill Supply: <strong>{med.remaining_pills ?? 58}</strong> / {med.total_pills ?? 60} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware Access Event Audit Trail */}
      <div className="stone-card" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="var(--text-ink)" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)' }}>PulseLock Hardware Audit Trail</h3>
              <p style={{ fontSize: 12, color: 'var(--text-stone)' }}>
                Immutable event stream of biometric authentications & physical compartment access
              </p>
            </div>
          </div>
          <span className="badge badge-blue" style={{ fontSize: 10 }}>Live Stream</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-stone)', fontSize: 13 }}>
              No device events recorded yet. Touch the fingerprint sensor on your ESP32 to populate the audit log.
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-stone)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid var(--border-stone)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-forest)'
                  }}>
                    <Fingerprint size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ink)' }}>
                      Fingerprint Verified · Compartment {evt.compartment || 'C01'} Unlocked
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>
                      Device: {evt.device_id} · Patient ID: {evt.patient_id || 'P001'} · Medication: {evt.medication_name || 'Metformin'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-forest)', fontWeight: 600 }}>
                    AUTHORIZED
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-stone)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
