import { useCallback, useEffect, useRef } from 'react';

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundUnlockedRef = useRef(false);
  const lastSoundPlayedAtRef = useRef(0);

  const unlockNotificationSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) {
      soundUnlockedRef.current = true;
      return;
    }
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }
    const context = audioContextRef.current;
    if (context.state === 'running') {
      soundUnlockedRef.current = true;
      return;
    }
    context
      .resume()
      .then(() => {
        soundUnlockedRef.current = true;
      })
      .catch(() => {});
  }, []);

  const playNotificationSound = useCallback(() => {
    if (typeof window === 'undefined' || !soundUnlockedRef.current) return;

    const now = Date.now();
    if (now - lastSoundPlayedAtRef.current < 350) return;
    lastSoundPlayedAtRef.current = now;

    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtor();
    }
    const context = audioContextRef.current;
    if (context.state !== 'running') return;

    const run = () => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.08);
      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.19);
    };

    run();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlock = () => unlockNotificationSound();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      if (!audioContextRef.current) return;
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, [unlockNotificationSound]);

  return { playNotificationSound };
};
