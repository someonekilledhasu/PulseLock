'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  LayoutDashboard, 
  PlusCircle, 
  Calendar, 
  BarChart3, 
  Cpu, 
  LogOut,
  User,
  ShieldCheck,
  X,
  Pill
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: { fullName: string; username: string; email?: string; phone?: string } | null;
  onLogout: () => void;
  deviceConnected: boolean;
  onToggleHardwareBar: () => void;
  showHardwareBar: boolean;
}

export default function Navbar({
  currentTab,
  onTabChange,
  user,
  onLogout,
  deviceConnected,
  onToggleHardwareBar,
  showHardwareBar
}: NavbarProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add Prescription', icon: PlusCircle },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'analytics', label: 'Adherence', icon: BarChart3 },
  ];

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-stone)',
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: 1140,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Brand */}
          <div 
            onClick={() => onTabChange('dashboard')} 
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--btn-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Lock size={16} />
            </div>
            <div>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: 'var(--text-ink)',
                lineHeight: 1.1
              }}>
                PulseLock
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--text-stone)',
                letterSpacing: 0.6,
                fontWeight: 500
              }}>
                CONNECTED DISPENSER
              </div>
            </div>
          </div>

          {/* Center Nav Tabs */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--bg-subtle)',
            padding: '3px 4px',
            borderRadius: 9999,
            border: '1px solid var(--border-subtle)'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 15px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--text-ink)' : 'var(--text-slate)',
                    background: active ? '#ffffff' : 'transparent',
                    border: 'none',
                    boxShadow: active ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease'
                  }}
                >
                  <Icon size={14} color={active ? 'var(--text-ink)' : 'var(--text-stone)'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hardware Status Button */}
            <button
              onClick={onToggleHardwareBar}
              title="Toggle Hardware Link Details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 9999,
                background: showHardwareBar ? 'var(--bg-subtle)' : '#ffffff',
                border: '1px solid var(--border-stone)',
                color: 'var(--text-slate)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.16s ease'
              }}
            >
              <Cpu size={14} color={deviceConnected ? 'var(--color-forest)' : 'var(--color-ochre)'} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`dot ${deviceConnected ? 'dot-green' : 'dot-amber'}`} />
                <span style={{ color: 'var(--text-ink)', fontWeight: 600 }}>
                  {deviceConnected ? 'ESP32 Linked' : 'Connecting'}
                </span>
              </span>
            </button>

            {/* Profile Avatar Button */}
            {user && (
              <button
                onClick={() => setShowProfileModal(true)}
                title="View Patient Profile"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-ink)',
                  border: '1px solid var(--border-stone)'
                }}>
                  {initials}
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Patient Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(25, 22, 20, 0.35)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div className="stone-card" style={{
            width: '100%',
            maxWidth: 420,
            padding: '28px',
            background: '#ffffff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--text-ink)" />
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-ink)' }}>Patient Profile</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-stone)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-stone)',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 20
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)' }}>
                {user?.fullName || 'Alex Davis'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-stone)', marginTop: 2 }}>
                Patient ID: P001 · Linked Node: ESP32_01
              </div>

              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--border-stone)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-stone)' }}>Security PIN:</span>
                  <strong style={{ color: 'var(--text-ink)', fontFamily: 'var(--font-mono)' }}>•••• (Protected)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-stone)' }}>Emergency Contact:</span>
                  <span style={{ color: 'var(--text-slate)' }}>Dr. Sarah Lin</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-stone)' }}>Hardware Locks:</span>
                  <span style={{ color: 'var(--color-forest)', fontWeight: 600 }}>Active (C01, C02)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  onLogout();
                }}
                className="btn-secondary"
                style={{ flex: 1, color: 'var(--color-rose)', borderColor: 'var(--color-rose-border)' }}
              >
                <LogOut size={14} />
                <span>Switch Patient / Log Out</span>
              </button>

              <button
                onClick={() => setShowProfileModal(false)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
