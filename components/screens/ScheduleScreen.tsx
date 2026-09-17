'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight,
  Check
} from 'lucide-react';
import { DoseSchedule } from '@/lib/types';

interface ScheduleScreenProps {
  doses: DoseSchedule[];
  onSimulateAccess: (compartment?: string) => Promise<void>;
}

export default function ScheduleScreen({ doses, onSimulateAccess }: ScheduleScreenProps) {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  // Determine current active date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDayOffset);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  const targetDateFormatted = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const dayDoses = doses.filter(d => d.scheduled_datetime.startsWith(targetDateStr));

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 26
      }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, color: 'var(--text-ink)', marginBottom: 4 }}>
            Medication Schedule
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-slate)' }}>
            Physical dispenser access timeline and scheduled windows
          </p>
        </div>

        {/* View Switcher (Day / Week) */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-stone)',
          borderRadius: 9999,
          padding: 3
        }}>
          <button
            onClick={() => setViewMode('day')}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'day' ? '#ffffff' : 'transparent',
              color: viewMode === 'day' ? 'var(--text-ink)' : 'var(--text-slate)',
              boxShadow: viewMode === 'day' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.16s ease'
            }}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'week' ? '#ffffff' : 'transparent',
              color: viewMode === 'week' ? 'var(--text-ink)' : 'var(--text-slate)',
              boxShadow: viewMode === 'week' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.16s ease'
            }}
          >
            Week View
          </button>
        </div>
      </div>

      {/* Date Navigation Strip (for Day View) */}
      {viewMode === 'day' && (
        <div className="stone-card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          marginBottom: 20
        }}>
          <button
            onClick={() => setSelectedDayOffset(prev => prev - 1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-slate)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <ChevronLeft size={17} />
            <span style={{ fontSize: 13 }}>Previous Day</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14.5, color: 'var(--text-ink)' }}>
            <Calendar size={16} color="var(--text-slate)" />
            <span>{targetDateFormatted}</span>
            {selectedDayOffset === 0 && (
              <span className="badge badge-blue" style={{ fontSize: 10, padding: '2px 8px' }}>Today</span>
            )}
          </div>

          <button
            onClick={() => setSelectedDayOffset(prev => prev + 1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-slate)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ fontSize: 13 }}>Next Day</span>
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {/* Timeline Content */}
      {viewMode === 'day' ? (
        <div className="stone-card" style={{ padding: '28px 32px' }}>
          {dayDoses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-stone)' }}>
              <Clock size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: 13.5 }}>No doses scheduled for this date.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
              {/* Vertical timeline connector */}
              <div style={{
                position: 'absolute',
                top: 24,
                bottom: 24,
                left: 78,
                width: 1,
                background: 'var(--border-stone)',
                zIndex: 0
              }} />

              {dayDoses.map((dose) => {
                const timeStr = new Date(dose.scheduled_datetime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const isAccessed = dose.status === 'accessed';
                const isAvailable = dose.status === 'available';

                return (
                  <div
                    key={dose.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {/* Time */}
                    <div style={{
                      width: 66,
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: isAccessed ? 'var(--color-forest)' : isAvailable ? 'var(--color-ochre)' : 'var(--text-ink)'
                    }}>
                      {timeStr}
                    </div>

                    {/* Timeline Node */}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: isAccessed 
                        ? 'var(--color-forest)' 
                        : isAvailable 
                        ? 'var(--color-ochre)' 
                        : '#ffffff',
                      border: isAccessed || isAvailable ? 'none' : '2px solid var(--border-stone)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isAccessed || isAvailable ? '#ffffff' : 'var(--text-stone)',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                    }}>
                      {isAccessed ? <Check size={13} /> : isAvailable ? <Unlock size={12} /> : <Lock size={11} />}
                    </div>

                    {/* Dose Card */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: 14,
                      background: isAccessed 
                        ? 'var(--color-forest-bg)' 
                        : isAvailable 
                        ? 'var(--color-ochre-bg)' 
                        : '#ffffff',
                      border: isAccessed 
                        ? '1px solid var(--color-forest-border)' 
                        : isAvailable 
                        ? '1px solid var(--color-ochre-border)' 
                        : '1px solid var(--border-stone)'
                    }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-ink)' }}>
                          {dose.medication?.name || 'Metformin'}{' '}
                          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-slate)' }}>
                            {dose.medication?.strength || '500 mg'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-stone)', marginTop: 3 }}>
                          {dose.medication?.dose_amount || '1 tablet'} · {dose.medication?.food_instruction || 'after food'} ·{' '}
                          <strong>Compartment {dose.compartment_id}</strong>
                        </div>
                        {isAccessed && dose.accessed_at && (
                          <div style={{ fontSize: 11, color: 'var(--color-forest)', marginTop: 4, fontWeight: 500 }}>
                            Biometric verified at {new Date(dose.accessed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className={`badge ${
                          isAccessed ? 'badge-green' : isAvailable ? 'badge-amber' : 'badge-blue'
                        }`} style={{ fontSize: 10, padding: '2px 8px' }}>
                          {isAccessed ? '✓ Accessed' : isAvailable ? 'Available' : 'Upcoming'}
                        </span>

                        {isAvailable && (
                          <button
                            onClick={() => onSimulateAccess(dose.compartment_id)}
                            style={{
                              background: 'var(--color-ochre)',
                              border: 'none',
                              color: '#fff',
                              padding: '5px 12px',
                              borderRadius: 9999,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Unlock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Week View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
            return (
              <div key={day} className="stone-card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-ink)' }}>{day}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-stone)' }}>Sep {15 + idx}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-stone)',
                    fontSize: 11.5
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-ink)' }}>08:00 AM · Metformin</div>
                    <div style={{ fontSize: 10, color: 'var(--color-forest)', fontWeight: 500 }}>✓ Accessed (C01)</div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-stone)',
                    fontSize: 11.5
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-ink)' }}>12:30 PM · Vitamin D3</div>
                    <div style={{ fontSize: 10, color: 'var(--color-forest)', fontWeight: 500 }}>✓ Accessed (C02)</div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-stone)',
                    fontSize: 11.5
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-ink)' }}>08:00 PM · Metformin</div>
                    <div style={{ fontSize: 10, color: 'var(--color-blue)', fontWeight: 500 }}>Upcoming (C01)</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
