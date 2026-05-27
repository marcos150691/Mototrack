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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Simple lowpass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, t);

      // Envelope settings for smooth transition
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.01); // ultra-fast attack
      gain.gain.setValueAtTime(0.15, t + durations[idx] - 0.05); // hold
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
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[idx]);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t);
      osc.stop(t + durations[idx]);
    });
  } catch (e) {
    console.error("Erro ao tocar som de teste:", e);
  }
}
