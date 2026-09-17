'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Edit3, 
  ArrowRight, 
  AlertCircle,
  Volume2,
  RefreshCw
} from 'lucide-react';
import { ParsedPrescriptionAI } from '@/lib/types';

interface AddPrescriptionScreenProps {
  onParsedReady: (parsed: ParsedPrescriptionAI) => void;
}

export default function AddPrescriptionScreen({ onParsedReady }: AddPrescriptionScreenProps) {
  const [mode, setMode] = useState<'voice' | 'manual'>('voice');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio Canvas Waveform Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    name: 'Metformin',
    strength: '500 mg',
    dose_amount: '1 tablet',
    frequency: '2x daily',
    times: '08:00, 20:00',
    food_instruction: 'after food',
    duration_days: 30,
    compartment_id: 'C01'
  });

  // Setup Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      startAudioVisualizer();
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition notice:', event.error);
      setIsListening(false);
      stopAudioVisualizer();
      if (event.error === 'not-allowed') {
        setError('Microphone permission not granted. You can still type below or load the sample text.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioVisualizer();
    };

    (window as any)._pulseRecognition = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {}
      stopAudioVisualizer();
    };
  }, []);

  // Real Web Audio API Waveform Analyzer
  const startAudioVisualizer = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          ctx.fillStyle = '#226733';
          ctx.beginPath();
          ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth - 2, Math.max(barHeight, 3), 3);
          ctx.fill();

          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('Visualizer permission or context note:', e);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleSpeech = () => {
    setError(null);
    const recognition = (window as any)._pulseRecognition;
    if (!recognition) {
      setError('Speech recognition is not supported in this browser. Please type or use sample audio text.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      stopAudioVisualizer();
    } else {
      try {
        recognition.start();
      } catch (e) {
        recognition.stop();
        setTimeout(() => recognition.start(), 200);
      }
    }
  };

  const handleParseText = async (textToParse?: string) => {
    // 1. Immediately stop speech recognition if still active
    try {
      const recognition = (window as any)._pulseRecognition;
      if (recognition) {
        recognition.stop();
      }
    } catch (e) {}
    setIsListening(false);
    stopAudioVisualizer();

    const textareaEl = document.querySelector('textarea') as HTMLTextAreaElement | null;
    const targetText = (textToParse || transcript || textareaEl?.value || '').trim();

    if (!targetText) {
      setError('Please speak or enter your prescription instructions first.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const res = await fetch('/api/parse-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: targetText })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to parse prescription');
      }

      onParsedReady(data.data);
    } catch (err: any) {
      console.error('Prescription parse error:', err);
      setError(err.message || 'AI extraction failed. Please check the text and try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timesArray = manualForm.times
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onParsedReady({
      medicine: manualForm.name,
      strength: manualForm.strength,
      dose: manualForm.dose_amount,
      frequency: manualForm.frequency,
      times: timesArray.length > 0 ? timesArray : ['08:00', '20:00'],
      food: manualForm.food_instruction,
      duration_days: Number(manualForm.duration_days) || 30,
      confidence: 100
    });
  };

  const loadSampleVoice = () => {
    const sample = 'Metformin 500 milligrams, one tablet twice a day, after food, at 8 in the morning and 8 at night for 30 days.';
    setTranscript(sample);
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, color: 'var(--text-ink)', marginBottom: 6 }}>
          Add New Prescription
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-slate)' }}>
          PulseLock automatically schedules doses and controls physical dispenser compartments.
        </p>

        {/* Minimal Pill Mode Switcher */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-stone)',
          borderRadius: 9999,
          padding: 3,
          marginTop: 18
        }}>
          <button
            type="button"
            onClick={() => setMode('voice')}
            style={{
              padding: '7px 18px',
              borderRadius: 9999,
              fontSize: 12.5,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: mode === 'voice' ? '#ffffff' : 'transparent',
              color: mode === 'voice' ? 'var(--text-ink)' : 'var(--text-slate)',
              boxShadow: mode === 'voice' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.16s ease'
            }}
          >
            <Mic size={14} />
            <span>Voice Entry (AI)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            style={{
              padding: '7px 18px',
              borderRadius: 9999,
              fontSize: 12.5,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: mode === 'manual' ? '#ffffff' : 'transparent',
              color: mode === 'manual' ? 'var(--text-ink)' : 'var(--text-slate)',
              boxShadow: mode === 'manual' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.16s ease'
            }}
          >
            <Edit3 size={14} />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--color-rose-bg)',
          border: '1px solid var(--color-rose-border)',
          color: 'var(--color-rose)',
          padding: '12px 16px',
          borderRadius: 12,
          fontSize: 13,
          marginBottom: 20
        }}>
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Voice Mode */}
      {mode === 'voice' && (
        <div className="stone-card" style={{ padding: '40px 36px', textAlign: 'center' }}>
          {/* Calming Microphone Button */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
            {isListening && (
              <div style={{
                position: 'absolute',
                inset: -12,
                borderRadius: '50%',
                border: '2px solid var(--color-forest-border)',
                animation: 'gentlePulse 1.8s infinite'
              }} />
            )}

            <button
              onClick={toggleSpeech}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: isListening ? 'var(--color-forest)' : 'var(--btn-ink)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(25, 22, 20, 0.12)',
                transition: 'all 0.2s ease'
              }}
            >
              {isListening ? <MicOff size={30} /> : <Mic size={30} />}
            </button>
          </div>

          {/* Real Audio Waveform Canvas */}
          <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <canvas
              ref={canvasRef}
              width={260}
              height={36}
              style={{ display: isListening ? 'block' : 'none' }}
            />
          </div>

          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-ink)', marginBottom: 4 }}>
            {isListening ? 'Listening to your voice...' : 'Click microphone to speak prescription'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-stone)', marginBottom: 22 }}>
            Speak naturally: include medicine name, dosage, frequency, times, and duration.
          </p>

          {/* Transcript input */}
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{
              fontSize: 11.5,
              color: 'var(--text-stone)',
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Prescription Statement
            </label>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder='e.g. "Metformin 500 milligrams, one tablet twice a day, after food, at 8 in the morning and 8 at night for 30 days."'
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Helper Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <button
              type="button"
              onClick={loadSampleVoice}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-slate)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'underline'
              }}
            >
              <Volume2 size={14} />
              <span>Load sample prescription format</span>
            </button>

            <button
              type="button"
              onClick={() => handleParseText(transcript)}
              disabled={isParsing}
              className="btn-primary"
            >
              {isParsing ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              <span>{isParsing ? 'Structuring with AI...' : 'Parse Prescription with AI'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="stone-card" style={{ padding: '36px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 24
          }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Medicine Name *
              </label>
              <input
                required
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                placeholder="e.g. Metformin"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Strength *
              </label>
              <input
                required
                value={manualForm.strength}
                onChange={(e) => setManualForm({ ...manualForm, strength: e.target.value })}
                placeholder="e.g. 500 mg"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Dose Amount
              </label>
              <input
                value={manualForm.dose_amount}
                onChange={(e) => setManualForm({ ...manualForm, dose_amount: e.target.value })}
                placeholder="e.g. 1 tablet"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Frequency
              </label>
              <input
                value={manualForm.frequency}
                onChange={(e) => setManualForm({ ...manualForm, frequency: e.target.value })}
                placeholder="e.g. 2x daily"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Dose Times (Comma separated 24hr)
              </label>
              <input
                value={manualForm.times}
                onChange={(e) => setManualForm({ ...manualForm, times: e.target.value })}
                placeholder="08:00, 20:00"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Food Instruction
              </label>
              <select
                value={manualForm.food_instruction}
                onChange={(e) => setManualForm({ ...manualForm, food_instruction: e.target.value })}
              >
                <option value="after food">After food</option>
                <option value="before food">Before food</option>
                <option value="with food">With food</option>
                <option value="any">Any time</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Duration (Days)
              </label>
              <input
                type="number"
                value={manualForm.duration_days}
                onChange={(e) => setManualForm({ ...manualForm, duration_days: Number(e.target.value) })}
                placeholder="30"
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-slate)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Assigned PulseLock Compartment
              </label>
              <select
                value={manualForm.compartment_id}
                onChange={(e) => setManualForm({ ...manualForm, compartment_id: e.target.value })}
              >
                <option value="C01">Compartment C01 (Top Servo)</option>
                <option value="C02">Compartment C02 (Bottom Servo)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="submit" className="btn-primary">
              <span>Review Prescription</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
