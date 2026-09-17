'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import HardwareTestBar from '@/components/HardwareTestBar';
import LoginScreen from '@/components/screens/LoginScreen';
import DashboardScreen from '@/components/screens/DashboardScreen';
import AddPrescriptionScreen from '@/components/screens/AddPrescriptionScreen';
import ConfirmationScreen from '@/components/screens/ConfirmationScreen';
import ScheduleScreen from '@/components/screens/ScheduleScreen';
import AnalyticsScreen from '@/components/screens/AnalyticsScreen';
import { DoseSchedule, AdherenceStats, DeviceEvent, ParsedPrescriptionAI } from '@/lib/types';
import { Check, AlertCircle } from 'lucide-react';
import { medicalAudio } from '@/lib/audioChime';

export default function App() {
  // Real session persistence state
  const [user, setUser] = useState<{ id: string; username: string; fullName: string; email?: string; phone?: string } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'schedule' | 'analytics'>('dashboard');
  const [showHardwareBar, setShowHardwareBar] = useState(true);
  const [pendingParsedData, setPendingParsedData] = useState<ParsedPrescriptionAI | null>(null);

  // Live Data State
  const [nextDose, setNextDose] = useState<DoseSchedule | null>(null);
  const [todayDoses, setTodayDoses] = useState<DoseSchedule[]>([]);
  const [allDoses, setAllDoses] = useState<DoseSchedule[]>([]);
  const [stats, setStats] = useState<AdherenceStats | null>(null);
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Track previous dose status to detect when window opens
  const prevNextDoseStatus = useRef<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pulselock_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.fullName) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn('Session restore note:', e);
    } finally {
      setSessionChecked(true);
    }
  }, []);

  const handleLogin = (loggedInUser: { id: string; username: string; fullName: string; email?: string; phone?: string }) => {
    setUser(loggedInUser);
    try {
      localStorage.setItem('pulselock_session', JSON.stringify(loggedInUser));
    } catch (e) {}
    showToast(`Welcome back, ${loggedInUser.fullName}! PulseLock connected.`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('pulselock_session');
    } catch (e) {}
    showToast('Signed out of PulseLock profile.', 'info');
  };

  // Fetch Schedules & Doses
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        const incomingNext = data.nextDose || null;

        // Detect if window just opened and chime
        if (incomingNext?.status === 'available' && prevNextDoseStatus.current === 'upcoming') {
          medicalAudio.playWindowReady();
          showToast(`Scheduled dose window open for ${incomingNext.medication?.name || 'Metformin'}.`, 'info');
        }
        if (incomingNext) {
          prevNextDoseStatus.current = incomingNext.status;
        }

        setNextDose(incomingNext);
        setTodayDoses(data.todayDoses || []);
        setAllDoses(data.doses || []);
      }
    } catch (e) {
      console.warn('Schedule sync warning:', e);
    }
  }, []);

  // Fetch Analytics & Events
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
        setEvents(data.recentEvents || []);
      }
    } catch (e) {
      console.warn('Analytics sync warning:', e);
    }
  }, []);

  // Check Hardware Sync Status
  const checkDeviceSync = useCallback(async () => {
    try {
      const res = await fetch('/api/device?deviceId=ESP32_01');
      if (res.ok) {
        setDeviceConnected(true);
      }
    } catch (e) {
      setDeviceConnected(false);
    }
  }, []);

  // Auto-refresh poll every 3.5s for seamless ESP32 event detection
  useEffect(() => {
    if (!user) return;

    fetchSchedules();
    fetchAnalytics();
    checkDeviceSync();

    const interval = setInterval(() => {
      fetchSchedules();
      fetchAnalytics();
      checkDeviceSync();
    }, 3500);

    return () => clearInterval(interval);
  }, [user, fetchSchedules, fetchAnalytics, checkDeviceSync]);

  // Handle Biometric Hardware Access
  const handleSimulateAccess = async (compartment = 'C01') => {
    try {
      const res = await fetch('/api/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'ESP32_01',
          eventType: 'access_granted',
          compartment,
          patientId: user?.id || 'P001',
          status: 'accessed'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process hardware access');
      }

      if (!data.accessGranted) {
        // Physical Time Lock Enforced (Access Denied)
        medicalAudio.playAccessDenied();
        showToast(data.message || 'Access Blocked: Next dose is physically locked until its scheduled window.', 'info');
        await fetchSchedules();
        await fetchAnalytics();
        return;
      }

      // Access Granted
      medicalAudio.playAccessGranted();
      showToast(data.message || `Biometric Verified · Dose dispensed! Dispenser relocked until next dose.`, 'success');
      await fetchSchedules();
      await fetchAnalytics();
    } catch (e: any) {
      showToast(e.message || 'Access error', 'info');
      throw e;
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      if (res.ok) {
        showToast('Demo reset to initial clinical schedule & compliance stream.', 'success');
        await fetchSchedules();
        await fetchAnalytics();
      }
    } catch (e: any) {
      showToast('Reset note: ' + e.message, 'info');
    }
  };

  const handleActivateWindow = async () => {
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate_window' })
      });
      if (res.ok) {
        medicalAudio.playWindowReady();
        showToast('Next dose window is now OPEN. Ready for Biometric Unlock!', 'success');
        await fetchSchedules();
      }
    } catch (e: any) {
      showToast('Arm window note: ' + e.message, 'info');
    }
  };

  // Prevent flash before session check completes
  if (!sessionChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-stone)', fontFamily: 'var(--font-mono)' }}>
          Initializing PulseLock Secure Node...
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return (
      <main>
        <LoginScreen onLoginSuccess={handleLogin} />
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        currentTab={activeTab}
        onTabChange={(tab) => {
          setPendingParsedData(null);
          setActiveTab(tab as any);
        }}
        user={user}
        onLogout={handleLogout}
        deviceConnected={deviceConnected}
        onToggleHardwareBar={() => setShowHardwareBar(!showHardwareBar)}
        showHardwareBar={showHardwareBar}
      />

      {/* Hardware Live Link Bar */}
      {showHardwareBar && (
        <HardwareTestBar
          onSimulateAccess={handleSimulateAccess}
          onResetDemo={handleResetDemo}
          onActivateWindow={handleActivateWindow}
          nextDoseCompartment={nextDose?.compartment_id || 'C01'}
          isWindowOpen={nextDose?.status === 'available'}
        />
      )}

      {/* Main Screen Router */}
      <main className="app-container" style={{ flex: 1, paddingTop: 32 }}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            nextDose={nextDose}
            todayDoses={todayDoses}
            deviceConnected={deviceConnected}
            onNavigate={(tab) => {
              setPendingParsedData(null);
              setActiveTab(tab as any);
            }}
            onSimulateAccess={handleSimulateAccess}
          />
        )}

        {activeTab === 'add' && (
          pendingParsedData ? (
            <ConfirmationScreen
              parsedData={pendingParsedData}
              onConfirmSuccess={() => {
                setPendingParsedData(null);
                setActiveTab('dashboard');
                showToast('Prescription activated! Schedule generated and locks armed.', 'success');
                fetchSchedules();
                fetchAnalytics();
              }}
              onBackToEdit={() => setPendingParsedData(null)}
            />
          ) : (
            <AddPrescriptionScreen
              onParsedReady={(parsed) => setPendingParsedData(parsed)}
            />
          )
        )}

        {activeTab === 'schedule' && (
          <ScheduleScreen
            doses={allDoses}
            onSimulateAccess={handleSimulateAccess}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsScreen
            stats={stats}
            events={events}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
          border: toastMessage.type === 'success' ? '1px solid var(--color-forest-border)' : '1px solid var(--border-stone)',
          color: 'var(--text-ink)',
          padding: '12px 18px',
          borderRadius: 14,
          boxShadow: '0 4px 20px rgba(28, 25, 23, 0.08)',
          fontSize: 13,
          fontWeight: 500
        }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: toastMessage.type === 'success' ? 'var(--color-forest-bg)' : 'var(--bg-subtle)',
            color: toastMessage.type === 'success' ? 'var(--color-forest)' : 'var(--text-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check size={13} />
          </div>
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
