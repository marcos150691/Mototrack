/**
 * Synthesizes a high-fidelity digital "mileage target reached" chime.
 * Uses Web Audio API oscillator nodes to create an ascending, modern notification ring.
 */
export function playMilestoneSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (browser security blocks audio until first click)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;

    // Ascending "Major Arpeggio" melody for achievement celebration:
    // C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const delays = [0, 0.08, 0.16, 0.24];
    const durations = [0.25, 0.25, 0.25, 0.45];

    notes.forEach((freq, idx) => {
      const t = now + delays[idx];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Using triangle wave for a richer, louder and warmer sound that cuts through background noise
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Simple lowpass filter for warmth and preventing harshness
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, t);

      // Multiplied the gain value from 0.15 to 0.65 for high-volume playback
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.65, t + 0.01); // ultra-fast attack with higher volume
      gain.gain.setValueAtTime(0.65, t + durations[idx] - 0.05); // hold
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[idx]); // custom decay

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + durations[idx]);
    });
  } catch (error) {
    console.error("Erro ao emitir alerta sonoro:", error);
  }
}

/**
 * Synthesizes a simple "chime beep" to test the alert sound.
 */
export function playTestSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // Quick pleasant double-beep (A5 to C6)
    const notes = [880.00, 1046.50];
    const delays = [0, 0.08];
    const durations = [0.12, 0.2];
    
    notes.forEach((freq, idx) => {
      const t = now + delays[idx];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Using triangle wave for improved audibility and loud projection
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      
      // Simple lowpass filter to smooth out high harmonics
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, t);

      // Multiplied the gain value from 0.1 to 0.6 for higher volume
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.6, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[idx]);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t);
      osc.stop(t + durations[idx]);
    });
  } catch (e) {
    console.error("Erro ao tocar som de teste:", e);
  }
}
