export async function startRecording(onLimit) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
    video: false,
  });
  let context;
  try {
    context = new (window.AudioContext || window.webkitAudioContext)();
    await context.resume();
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    throw e;
  }
  const source = context.createMediaStreamSource(stream),
    processor = context.createScriptProcessor(4096, 1, 1),
    muted = context.createGain();
  muted.gain.value = 0;
  let chunks = [],
    stopped = false;
  processor.onaudioprocess = (e) =>
    chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(processor);
  processor.connect(muted);
  muted.connect(context.destination);
  const timer = setTimeout(() => onLimit?.(), 60000);
  return {
    cancel: async () => {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      await context.close();
      chunks = [];
    },
    stop: async () => {
      if (stopped) return null;
      stopped = true;
      clearTimeout(timer);
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      const sampleRate = context.sampleRate;
      await context.close();
      const count = chunks.reduce((n, c) => n + c.length, 0);
      if (count < sampleRate * 0.3) throw new Error("录音太短了，请再说一次。");
      const ratio = sampleRate / 16000,
        outputLength = Math.floor(count / ratio),
        flat = new Float32Array(count);
      let offset = 0;
      chunks.forEach((c) => {
        flat.set(c, offset);
        offset += c.length;
      });
      const buffer = new ArrayBuffer(44 + outputLength * 2),
        v = new DataView(buffer);
      const text = (p, s) =>
        Array.from(s).forEach((c, i) => v.setUint8(p + i, c.charCodeAt(0)));
      text(0, "RIFF");
      v.setUint32(4, 36 + outputLength * 2, true);
      text(8, "WAVE");
      text(12, "fmt ");
      v.setUint32(16, 16, true);
      v.setUint16(20, 1, true);
      v.setUint16(22, 1, true);
      v.setUint32(24, 16000, true);
      v.setUint32(28, 32000, true);
      v.setUint16(32, 2, true);
      v.setUint16(34, 16, true);
      text(36, "data");
      v.setUint32(40, outputLength * 2, true);
      for (let i = 0; i < outputLength; i++) {
        const a = Math.floor(i * ratio),
          b = Math.max(a + 1, Math.floor((i + 1) * ratio));
        let sum = 0;
        for (let j = a; j < b && j < flat.length; j++) sum += flat[j];
        const s = Math.max(-1, Math.min(1, sum / (b - a)));
        v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
      }
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return btoa(binary);
    },
  };
}
