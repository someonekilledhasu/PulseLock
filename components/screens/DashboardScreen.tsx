'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Clock, 
  Fingerprint, 
  Plus, 
  Calendar, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Cpu,
  Zap,
  Check,
  Pill,
  Volume2
} from 'lucide-react';
import { DoseSchedule } from '@/lib/types';
import { getCountdown } from '@/lib/scheduler';
import { medicalAudio } from '@/lib/audioChime';

interface DashboardScreenProps {
  nextDose: DoseSchedule | null;
  todayDoses: DoseSchedule[];
  deviceConnected: boolean;
  onNavigate: (tab: string) => void;
  onSimulateAccess: (compartment?: string) => Promise<void>;
}

export default function DashboardScreen({
  nextDose,
  todayDoses,
  deviceConnected,
  onNavigate,
  onSimulateAccess
}: DashboardScreenProps) {
  const [countdownText, setCountdownText] = useState('Calculating...');
  const [isAccessing, setIsAccessing] = useState(false);

  useEffect(() => {
    if (!nextDose) {
      setCountdownText('No pending doses');
      return;
    }

    const updateTimer = () => {
      const info = getCountdown(nextDose.scheduled_datetime);
      setCountdownText(info.text);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextDose]);

  const handleAccessClick = async () => {
    if (!nextDose) return;
    setIsAccessing(true);
    try {
      await onSimulateAccess(nextDose.compartment_id);
      // Play gentle medical confirmation chime
      medicalAudio.playAccessGranted();
    } finally {
      setIsAccessing(false);
    }
  };

  const isWindowAvailable = nextDose?.status === 'available';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Section: Active Dose Card */}
      <div 
        className="stone-card" 
        style={{
          position: 'relative',
          padding: '36px 40px',
          background: isWindowAvailable ? '#fffdf7' : '#ffffff',
          border: isWindowAvailable ? '1px solid var(--color-ochre-border)' : '1px solid var(--border-stone)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 28
        }}>
          {/* Dose Information */}
          <div style={{ flex: '1 1 360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className={`badge ${isWindowAvailable ? 'badge-amber' : 'badge-blue'}`}>
                <span className={`dot ${isWindowAvailable ? 'dot-amber' : 'dot-blue'}`} />
                {isWindowAvailable ? 'Dose Window Open Now' : 'Next Scheduled Dose'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-stone)' }}>Today</span>
            </div>

            <h2 style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -0.8,
              color: 'var(--text-ink)',
              marginBottom: 6,
              lineHeight: 1.15
            }}>
              {nextDose?.medication?.name || 'Metformin'}{' '}
              <span style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-slate)' }}>
                {nextDose?.medication?.strength || '500 mg'}
              </span>
            </h2>

            <p style={{ fontSize: 14, color: 'var(--text-slate)', marginBottom: 20 }}>
              {nextDose?.medication?.dose_amount || '1 tablet'} ·{' '}
              {nextDose?.medication?.food_instruction || 'Take after food'} ·{' '}
              <strong style={{ color: 'var(--text-ink)', fontWeight: 600 }}>
                Compartment {nextDose?.compartment_id || 'C01'}
              </strong>
            </p>

            {/* Countdown / Window Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-subtle)',
              padding: '7px 16px',
              borderRadius: 9999,
              border: '1px solid var(--border-stone)',
              marginBottom: 24
            }}>
              <Clock size={14} color={isWindowAvailable ? 'var(--color-ochre)' : 'var(--text-slate)'} />
              <span style={{ fontSize: 12.5, color: 'var(--text-slate)' }}>Access Window:</span>
              <strong style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13.5,
                color: isWindowAvailable ? 'var(--color-ochre)' : 'var(--text-ink)'
              }}>
                {countdownText}
              </strong>
            </div>

            {/* Primary Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={handleAccessClick}
                disabled={isAccessing}
                className="btn-primary"
                style={{
                  background: isWindowAvailable ? 'var(--color-ochre)' : '#262320',
                  borderColor: isWindowAvailable ? 'var(--color-ochre)' : '#262320'
                }}
              >
                {isWindowAvailable ? <Fingerprint size={16} /> : <Lock size={15} />}
                <span>
                  {isAccessing
                    ? 'Authenticating Biometrics...'
                    : isWindowAvailable
                    ? 'Authorize Biometric Unlock (Compartment ' + (nextDose?.compartment_id || 'C01') + ')'
                    : 'Physical Lock Armed · Test Early Access Block'}
                </span>
              </button>

              {!isWindowAvailable && (
                <div style={{ fontSize: 12, color: 'var(--text-stone)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={14} color="var(--color-forest)" />
                  <span>Next medicine will only open at scheduled time</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => medicalAudio.playWindowReady()}
                title="Test Audio Chime"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-stone)',
                  color: 'var(--text-slate)',
                  padding: '10px 14px',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Volume2 size={14} />
                <span>Audio Alert</span>
              </button>
            </div>
          </div>

          {/* Compartment Status Indicator */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            borderRadius: 18,
            padding: '24px 32px',
            minWidth: 190,
            textAlign: 'center'
          }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#ffffff',
              border: isWindowAvailable 
                ? '2px solid var(--color-ochre)' 
                : '1px solid var(--border-stone)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: isWindowAvailable ? 'var(--color-ochre)' : 'var(--text-slate)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}>
              {isWindowAvailable ? <Unlock size={24} /> : <Lock size={22} />}
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-ink)',
              letterSpacing: -0.2
            }}>
              {nextDose?.scheduled_datetime 
                ? new Date(nextDose.scheduled_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : '08:00 PM'}
            </div>

            <div style={{
              fontSize: 11,
              color: isWindowAvailable ? 'var(--color-ochre)' : 'var(--text-stone)',
              fontWeight: 600,
              marginTop: 4,
              letterSpacing: 0.5,
              textTransform: 'uppercase'
            }}>
              {isWindowAvailable ? 'DISPENSER READY' : 'PHYSICAL LOCK ARMED'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-stone)', marginTop: 2 }}>
              Compartment {nextDose?.compartment_id || 'C01'}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Today's Doses + Hardware Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24
      }}>
        {/* Today's Schedule Card */}
        <div className="stone-card" style={{ padding: '28px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-ink)' }}>Today's Doses</h3>
              <p style={{ fontSize: 12, color: 'var(--text-stone)' }}>Chronological medication access timeline</p>
            </div>
            <button
              onClick={() => onNavigate('schedule')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-ink)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>Full Schedule</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayDoses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-stone)', fontSize: 13 }}>
                No doses scheduled for today.
              </div>
            ) : (
              todayDoses.map((dose) => {
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
                      justifyContent: 'space-between',
                      padding: '12px 16px',
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
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: '#ffffff',
                        border: '1px solid var(--border-stone)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isAccessed ? 'var(--color-forest)' : isAvailable ? 'var(--color-ochre)' : 'var(--text-stone)'
                      }}>
                        {isAccessed ? <Check size={16} /> : isAvailable ? <Unlock size={14} /> : <Clock size={14} />}
                      </div>

                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-ink)' }}>
                          {dose.medication?.name || 'Metformin'}{' '}
                          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-slate)' }}>
                            {dose.medication?.strength || '500 mg'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>
                          {timeStr} · Compartment {dose.compartment_id}
                          {isAccessed && dose.accessed_at && (
                            <span style={{ color: 'var(--color-forest)', marginLeft: 6, fontWeight: 500 }}>
                              (Accessed at {new Date(dose.accessed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${
                      isAccessed ? 'badge-green' : isAvailable ? 'badge-amber' : 'badge-blue'
                    }`} style={{ fontSize: 10, padding: '2px 8px' }}>
                      {isAccessed ? 'Accessed' : isAvailable ? 'Available' : 'Upcoming'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Hardware Status & Inventory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Device Health Card */}
          <div className="stone-card" style={{ padding: '26px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={18} color="var(--text-ink)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)' }}>PulseLock Dispenser Node</h3>
              </div>
              <span className={`badge ${deviceConnected ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                <span className={`dot ${deviceConnected ? 'dot-green' : 'dot-amber'}`} />
                {deviceConnected ? 'Online' : 'Connecting'}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 14,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-stone)'
            }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-stone)' }}>Lock State</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-ink)', marginTop: 2 }}>
                  Armed
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-stone)' }}>Battery</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-forest)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={13} />
                  88%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-stone)' }}>Biometrics</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-ink)', marginTop: 2 }}>
                  Ready
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-stone)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="var(--color-forest)" />
              <span>Physical access restricted to authorized patient biometrics.</span>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => onNavigate('add')}
              className="stone-card"
              style={{
                padding: '16px',
                textAlign: 'left',
                border: '1px solid var(--border-stone)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                color: 'var(--text-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Plus size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ink)' }}>Add Prescription</div>
                <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>Voice AI or Manual</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="stone-card"
              style={{
                padding: '16px',
                textAlign: 'left',
                border: '1px solid var(--border-stone)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                color: 'var(--text-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ink)' }}>Adherence Stats</div>
                <div style={{ fontSize: 11, color: 'var(--text-stone)' }}>Compliance Analytics</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
