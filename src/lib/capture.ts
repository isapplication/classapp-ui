"use client";

import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Signals } from "./types";

const WASM_BASE = "/mediapipe/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
/** A signal must hold this long before it counts as changed, so flickers don't flood the server. */
const SETTLE_MS = 1500;
const SPEAKING_RMS = 0.045;
const LOOKING_AWAY_RATIO = 0.18;

export type CaptureStatus = "off" | "starting" | "live" | "blocked" | "error";

type Discrete = {
  facePresent: boolean;
  look: NonNullable<Signals["look"]>;
  headDirection: NonNullable<Signals["headDirection"]>;
  peopleAtCamera: number;
  speaking: boolean;
};
type Key = keyof Discrete;

let landmarker: Promise<FaceLandmarker> | null = null;

function loadLandmarker(): Promise<FaceLandmarker> {
  landmarker ??= (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    const create = (delegate: "GPU" | "CPU") =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numFaces: 4,
      });
    return create("GPU").catch(() => create("CPU"));
  })();
  landmarker.catch(() => {
    landmarker = null;
  });
  return landmarker;
}

/** Head turn from the nose's position between the cheeks: ~0 facing the screen, ± turned. */
function headRatio(face: NormalizedLandmark[]): number {
  const nose = face[1];
  const a = face[234];
  const b = face[454];
  if (!nose || !a || !b) return 0;
  const dA = Math.abs(nose.x - a.x);
  const dB = Math.abs(nose.x - b.x);
  return dA + dB === 0 ? 0 : (dA - dB) / (dA + dB);
}

function classify(faces: NormalizedLandmark[][]): Omit<Discrete, "speaking"> {
  const first = faces[0];
  if (!first) {
    return { facePresent: false, look: "no_face", headDirection: "none", peopleAtCamera: 0 };
  }
  const r = headRatio(first);
  const facing = Math.abs(r) < LOOKING_AWAY_RATIO;
  return {
    facePresent: true,
    look: facing ? "at_screen" : "away",
    headDirection: facing ? "center" : r > 0 ? "left" : "right",
    peopleAtCamera: Math.min(faces.length, 20),
  };
}

function audioLevel(analyser: AnalyserNode | null, buffer: Uint8Array<ArrayBuffer>): number {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (const sample of buffer) {
    const v = (sample - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / buffer.length);
}

function networkInfo(): Signals["network"] {
  const c = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } }).connection;
  if (!c) return undefined;
  const type = ["slow-2g", "2g", "3g", "4g"].includes(c.effectiveType ?? "") ? c.effectiveType! : "unknown";
  return typeof c.downlink === "number" ? { type, downlinkMbps: c.downlink } : { type };
}

/**
 * Analyses this device's own camera and microphone in the browser (MediaPipe face landmarks + Web
 * Audio). No frame or sound leaves the device: only the derived signals, reported through
 * {@code onChange} when a signal settles on a new value.
 */
export function useDeviceSignals(
  enabled: boolean,
  onChange: (changed: Partial<Signals>, signals: Signals) => void,
  /** Bump to start the camera again, e.g. after access was granted in another page. */
  attempt = 0,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const latest = useRef<Signals>({ camera: "off" });
  const [status, setStatus] = useState<CaptureStatus>("off");
  const [signals, setSignals] = useState<Signals>({ camera: "off" });
  const [level, setLevel] = useState(0);
  const emitChange = useEffectEvent((changed: Partial<Signals>, current: Signals) => onChange(changed, current));

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let raf = 0;
    let evalTimer = 0;
    let stream: MediaStream | null = null;
    let audio: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    const buffer = new Uint8Array(512);
    let raw: Discrete = { facePresent: false, look: "no_face", headDirection: "none", peopleAtCamera: 0, speaking: false };
    const committed: Partial<Discrete> = {};
    const pending = new Map<Key, { value: Discrete[Key]; since: number }>();
    let speakingMs = 0;
    let currentLevel = 0;
    let lastFrame = performance.now();
    let lastVideoTime = -1;
    let videoEl: HTMLVideoElement | null = null;

    const snapshot = (): Signals => ({
      camera: "on",
      facePresent: committed.facePresent ?? false,
      look: committed.look ?? "no_face",
      headDirection: committed.headDirection ?? "none",
      peopleAtCamera: committed.peopleAtCamera ?? 0,
      speaking: committed.speaking ?? false,
      speakingSeconds: Math.round(speakingMs / 1000),
      ...(networkInfo() ? { network: networkInfo() } : {}),
    });

    const evaluate = () => {
      const now = performance.now();
      const changed: Partial<Discrete> = {};
      for (const key of Object.keys(raw) as Key[]) {
        const value = raw[key];
        if (committed[key] === value) {
          pending.delete(key);
          continue;
        }
        const p = pending.get(key);
        if (!p || p.value !== value) {
          pending.set(key, { value, since: now });
        } else if (committed[key] === undefined || now - p.since >= SETTLE_MS) {
          Object.assign(committed, { [key]: value });
          Object.assign(changed, { [key]: value });
          pending.delete(key);
        }
      }
      const current = snapshot();
      latest.current = current;
      setSignals(current);
      setLevel(currentLevel);
      if (Object.keys(changed).length > 0) emitChange(changed, current);
    };

    const start = async () => {
      setStatus("starting");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        if (!cancelled) setStatus("blocked");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      videoEl = videoRef.current;
      if (videoEl) {
        videoEl.srcObject = stream;
        await videoEl.play().catch(() => undefined);
      }
      try {
        audio = new AudioContext();
        analyser = audio.createAnalyser();
        analyser.fftSize = 512;
        audio.createMediaStreamSource(stream).connect(analyser);
      } catch {
        analyser = null;
      }
      let model: FaceLandmarker;
      try {
        model = await loadLandmarker();
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }
      if (cancelled) return;
      setStatus("live");

      const loop = () => {
        if (cancelled) return;
        const now = performance.now();
        const dt = now - lastFrame;
        lastFrame = now;
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.currentTime !== lastVideoTime) {
          lastVideoTime = v.currentTime;
          try {
            raw = { ...raw, ...classify(model.detectForVideo(v, now).faceLandmarks) };
          } catch {
            // a dropped frame; the next one will do
          }
        }
        currentLevel = audioLevel(analyser, buffer);
        raw.speaking = currentLevel > SPEAKING_RMS;
        if (raw.speaking) speakingMs += dt;
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      evalTimer = window.setInterval(evaluate, 250);
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearInterval(evalTimer);
      stream?.getTracks().forEach((t) => t.stop());
      void audio?.close().catch(() => undefined);
      if (videoEl) videoEl.srcObject = null;
      latest.current = { camera: "off" };
      setSignals({ camera: "off" });
      setLevel(0);
      setStatus("off");
    };
  }, [enabled, attempt]);

  return { videoRef, status, signals, level, latest };
}
