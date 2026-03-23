'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useProctoringML } from '@/hooks/useProctoringML';
import type { ProctoringFrameData } from '@/hooks/useProctoringML';

// ─── Color helpers ───────────────────────────────────────────────────────────

function scoreHsl(score: number) {
  const hue = (1 - Math.min(Math.max(score, 0), 1)) * 120;
  return `hsl(${hue}, 85%, 50%)`;
}

function scoreLabel(score: number) {
  if (score <= 0.3) return 'Safe';
  if (score <= 0.6) return 'Warning';
  return 'High Risk';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProctorTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'attention' | 'objects'>('attention');
  const [frameData, setFrameData] = useState<ProctoringFrameData | null>(null);
  const [history, setHistory] = useState<{ time: number; score: number }[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Throttle state updates to ~10fps (every 100ms) so React doesn't choke
  const lastStateUpdate = useRef(0);
  const latestFrame = useRef<ProctoringFrameData | null>(null);

  // Draw face mesh + gaze + pose arrows on canvas
  const drawOverlay = useCallback((data: ProctoringFrameData) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    if (data.landmarks) {
      // Draw face mesh dots
      ctx.fillStyle = 'rgba(0, 255, 170, 0.4)';
      for (const lm of data.landmarks) {
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw key landmark points larger
      const keyIndices = [1, 152, 263, 33, 287, 57, 468, 473]; // nose, chin, eyes, mouth, irises
      ctx.fillStyle = '#00ff88';
      for (const idx of keyIndices) {
        if (idx < data.landmarks.length) {
          const lm = data.landmarks[idx];
          ctx.beginPath();
          ctx.arc(lm.x * w, lm.y * h, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Draw iris circles
      if (data.landmarks.length >= 478) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        for (const irisCenter of [468, 473]) {
          const iris = data.landmarks[irisCenter];
          ctx.beginPath();
          ctx.arc(iris.x * w, iris.y * h, 6, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // Draw nose → gaze direction arrow
      const nose = data.landmarks[1];
      const noseX = nose.x * w;
      const noseY = nose.y * h;

      // Head pose arrow (yaw/pitch)
      const arrowLen = 60;
      const yawRad = (data.headPose.yaw * Math.PI) / 180;
      const pitchRad = (data.headPose.pitch * Math.PI) / 180;
      const endX = noseX + Math.sin(yawRad) * arrowLen;
      const endY = noseY + Math.sin(pitchRad) * arrowLen;

      ctx.strokeStyle = scoreHsl(data.score);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(noseX, noseY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(endY - noseY, endX - noseX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 10 * Math.cos(angle - 0.4), endY - 10 * Math.sin(angle - 0.4));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 10 * Math.cos(angle + 0.4), endY - 10 * Math.sin(angle + 0.4));
      ctx.stroke();
    }

    // Draw object-detection HUD boxes
    for (const item of data.detectedObjects) {
      if (!item.bbox) continue;

      const isSuspicious = data.suspiciousObjects.some(
        (s) => s.label === item.label && s.score === item.score,
      );
      const isPerson = item.label.toLowerCase() === 'person';
      const color = isSuspicious ? '#ef4444' : isPerson ? '#f59e0b' : '#60a5fa';

      ctx.strokeStyle = color;
      ctx.lineWidth = isSuspicious ? 3 : 2;
      ctx.strokeRect(item.bbox.x, item.bbox.y, item.bbox.width, item.bbox.height);

      const label = `${item.label} ${(item.score * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(label).width;
      const textY = Math.max(item.bbox.y - 18, 2);
      ctx.fillStyle = color;
      ctx.fillRect(item.bbox.x, textY, textWidth + 8, 16);
      ctx.fillStyle = '#000';
      ctx.fillText(label, item.bbox.x + 4, textY + 12);
    }

    // On-screen HUD
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const hudLines = [
      `Score: ${(data.score * 100).toFixed(0)}% (${scoreLabel(data.score)})`,
      `Yaw: ${data.headPose.yaw.toFixed(1)}° | Pitch: ${data.headPose.pitch.toFixed(1)}°`,
      `Gaze: ${data.gazeDirection} (dx: ${data.gazeDelta.x.toFixed(3)}, dy: ${data.gazeDelta.y.toFixed(3)})`,
      `Objects: ${data.detectedObjects.length} total | Suspicious: ${data.suspiciousObjects.length} | Extra people: ${data.extraPeopleCount}`,
      `Flags: ${data.flags.length > 0 ? data.flags.join(', ') : 'none'}`,
    ];
    hudLines.forEach((line, i) => {
      const y = 22 + i * 20;
      ctx.strokeText(line, 10, y);
      ctx.fillText(line, 10, y);
    });
  }, []);

  const onFrame = useCallback(
    (data: ProctoringFrameData) => {
      latestFrame.current = data;

      // Draw landmarks on canvas every frame (no React state involved)
      drawOverlay(data);

      const now = performance.now();
      if (now - lastStateUpdate.current < 100) return;
      lastStateUpdate.current = now;

      setFrameData(data);
      setHistory((prev) => {
        const entry = { time: Date.now(), score: data.score };
        const cutoff = Date.now() - 30_000; // keep 30s
        const next = [...prev, entry].filter((e) => e.time > cutoff);
        return next;
      });
    },
    [drawOverlay],
  );

  // Start webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setVideoReady(true);
        }
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : 'Failed to access camera');
      }
    };
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Run ML hook — no socket needed for debug page
  useProctoringML({
    videoElement: videoReady ? videoRef.current : null,
    enabled: videoReady,
    onFrame,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">AI Proctoring Debug</h1>
        <p className="text-gray-400 text-sm mb-4">
          Stand-alone diagnostic for the ML proctoring pipeline. No socket / no test required.
        </p>

        <div className="mb-4 inline-flex rounded-lg bg-gray-900 border border-gray-800 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('attention')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'attention'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            Attention (Gaze/Head)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('objects')}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              activeTab === 'objects'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            Object Detection
          </button>
        </div>

        {cameraError && (
          <div className="bg-red-900/60 border border-red-500 rounded-xl p-4 mb-4">
            <p className="text-red-300 font-semibold">Camera Error: {cameraError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left: Video + Canvas overlay ───────────────── */}
          <div className="lg:col-span-2">
            <div className="relative rounded-xl overflow-hidden bg-black border border-gray-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full block"
                style={{ maxHeight: '70vh' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              {!videoReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-indigo-500 mx-auto mb-3" />
                    <p className="text-gray-400">Initializing camera &amp; ML model...</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Score Graph ─────────────────────────────────── */}
            <div className="mt-4 bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Risk Score (last 30s)</h3>
              <ScoreGraph history={history} />
            </div>
          </div>

          {/* ── Right: Data panels ─────────────────────────── */}
          <div className="space-y-4">
            {/* Risk Score Card */}
            <DataCard title="Risk Score">
              {frameData ? (
                <>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span
                      className="text-5xl font-black tabular-nums"
                      style={{ color: scoreHsl(frameData.score) }}
                    >
                      {(frameData.score * 100).toFixed(0)}%
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: scoreHsl(frameData.score) }}
                    >
                      {scoreLabel(frameData.score)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${frameData.score * 100}%`,
                        background: scoreHsl(frameData.score),
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Waiting for data...</p>
              )}
            </DataCard>

            {activeTab === 'attention' ? (
              <>
                {/* Face Detection */}
                <DataCard title="Face Detection">
                  {frameData ? (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${frameData.faceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
                      />
                      <span className={frameData.faceDetected ? 'text-green-400' : 'text-red-400'}>
                        {frameData.faceDetected ? 'Face Detected' : 'No Face Detected'}
                      </span>
                      {frameData.landmarks && (
                        <span className="text-gray-500 text-xs ml-auto">
                          {frameData.landmarks.length} landmarks
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </DataCard>

                {/* Head Pose */}
                <DataCard title="Head Pose">
                  {frameData ? (
                    <div className="space-y-2">
                      <PoseBar
                        label="Yaw"
                        value={frameData.headPose.yaw}
                        threshold={frameData.thresholds.yaw}
                        unit="°"
                        description="Left / Right rotation"
                      />
                      <PoseBar
                        label="Pitch"
                        value={frameData.headPose.pitch}
                        threshold={frameData.thresholds.pitch}
                        unit="°"
                        description="Up / Down tilt"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </DataCard>

                {/* Gaze */}
                <DataCard title="Gaze (Iris Position)">
                  {frameData ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Direction</span>
                        <span
                          className={
                            frameData.gazeDirection === 'center'
                              ? 'text-green-400'
                              : 'text-amber-400 font-bold'
                          }
                        >
                          {frameData.gazeDirection.toUpperCase()}
                        </span>
                      </div>
                      <PoseBar
                        label="Horiz (dx)"
                        value={frameData.gazeDelta.x}
                        threshold={frameData.thresholds.irisOffCenterX}
                        unit=""
                        precision={3}
                        description="Deviation from center (0.5)"
                      />
                      <div className="text-xs mt-2">
                        <span className="text-gray-500">Vertical (pitch-based):</span>
                        <div className="flex gap-2 mt-1">
                          <div className="flex-1 text-center">
                            <div className="text-gray-600 text-[10px]">
                              Down (θ &gt; {frameData.thresholds.pitchDownThreshold}°)
                            </div>
                            <div
                              className={`text-sm font-mono ${frameData.headPose.pitch > frameData.thresholds.pitchDownThreshold ? 'text-red-400' : 'text-gray-400'}`}
                            >
                              {frameData.headPose.pitch.toFixed(0)}°
                            </div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-gray-600 text-[10px]">
                              Up (θ &lt; {frameData.thresholds.pitchUpThreshold}°)
                            </div>
                            <div
                              className={`text-sm font-mono ${frameData.headPose.pitch < frameData.thresholds.pitchUpThreshold ? 'text-red-400' : 'text-gray-400'}`}
                            >
                              {frameData.headPose.pitch.toFixed(0)}°
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Gaze crosshair */}
                      <div className="flex justify-center mt-2">
                        <div className="relative w-24 h-24 border border-gray-700 rounded-lg bg-gray-800 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-px h-full bg-gray-700 absolute" />
                            <div className="h-px w-full bg-gray-700 absolute" />
                          </div>
                          {/* Dot representing gaze */}
                          <div
                            className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.6)]"
                            style={{
                              left: `${50 + (frameData.gazeDelta.x / 0.5) * 50}%`,
                              top: `${50 + (frameData.gazeDelta.y / 0.5) * 50}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                          {/* Threshold ring */}
                          <div
                            className="absolute border border-dashed border-amber-500/50 rounded-full"
                            style={{
                              width: `${(frameData.thresholds.irisOffCenterX / 0.5) * 100}%`,
                              height: `${(frameData.thresholds.irisOffCenterX / 0.5) * 100}%`,
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </DataCard>
              </>
            ) : (
              <>
                <DataCard title="Object Summary">
                  {frameData ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Detected Objects</span>
                        <span className="text-gray-200 font-semibold">
                          {frameData.detectedObjects.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Suspicious Objects</span>
                        <span
                          className={
                            frameData.suspiciousObjects.length > 0
                              ? 'text-red-400 font-semibold'
                              : 'text-green-400 font-semibold'
                          }
                        >
                          {frameData.suspiciousObjects.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">People In Frame</span>
                        <span className="text-gray-200 font-semibold">{frameData.personCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Extra People</span>
                        <span
                          className={
                            frameData.extraPeopleCount > 0
                              ? 'text-red-400 font-semibold'
                              : 'text-green-400 font-semibold'
                          }
                        >
                          {frameData.extraPeopleCount}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </DataCard>

                <DataCard title="Suspicious Objects">
                  {frameData ? (
                    frameData.suspiciousObjects.length > 0 ? (
                      <div className="space-y-2">
                        {frameData.suspiciousObjects.map((item) => (
                          <div
                            key={`${item.label}-${item.score}`}
                            className="flex items-center justify-between rounded-md border border-red-800 bg-red-950/40 px-2 py-1"
                          >
                            <span className="text-red-300 text-sm">{item.label}</span>
                            <span className="text-red-200 text-xs font-mono">
                              {(item.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-green-400 text-sm">✓ No suspicious objects detected</p>
                    )
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </DataCard>

                <DataCard title="All Detected Objects">
                  {frameData ? (
                    frameData.detectedObjects.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-auto pr-1">
                        {frameData.detectedObjects.map((item) => (
                          <div key={`${item.label}-${item.score}`}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-300">{item.label}</span>
                              <span className="text-gray-400 font-mono">
                                {(item.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${Math.min(item.score * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No objects detected yet</p>
                    )
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </DataCard>
              </>
            )}

            {/* Active Flags */}
            <DataCard title="Active Flags">
              {frameData ? (
                frameData.flags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {frameData.flags.map((flag) => (
                      <span
                        key={flag}
                        className="px-2 py-1 text-xs font-bold rounded-full bg-red-900/60 text-red-300 border border-red-700"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-400 text-sm">✓ No violations detected</p>
                )
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </DataCard>

            {/* Thresholds / Config */}
            <DataCard title="Algorithm Config">
              {frameData ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-500">Yaw threshold</span>
                  <span className="text-gray-300 tabular-nums">{frameData.thresholds.yaw}°</span>
                  <span className="text-gray-500">Pitch threshold</span>
                  <span className="text-gray-300 tabular-nums">{frameData.thresholds.pitch}°</span>
                  <span className="text-gray-500">Iris horiz threshold</span>
                  <span className="text-gray-300 tabular-nums">
                    {frameData.thresholds.irisOffCenterX}
                  </span>
                  <span className="text-gray-500">Down threshold (pitch)</span>
                  <span className="text-gray-300 tabular-nums">
                    &gt; {frameData.thresholds.pitchDownThreshold}°
                  </span>
                  <span className="text-gray-500">Up threshold (pitch)</span>
                  <span className="text-gray-300 tabular-nums">
                    &lt; {frameData.thresholds.pitchUpThreshold}°
                  </span>
                  <span className="text-gray-500">Rise speed</span>
                  <span className="text-gray-300 tabular-nums">
                    +{frameData.thresholds.riskRisePerSecond}/s
                  </span>
                  <span className="text-gray-500">Drain speed</span>
                  <span className="text-gray-300 tabular-nums">
                    −{frameData.thresholds.riskLeakPerSecond.toFixed(4)}/s (
                    {(1 / frameData.thresholds.riskLeakPerSecond).toFixed(0)}s to empty)
                  </span>
                  <span className="text-gray-500">Violation window</span>
                  <span className="text-gray-300 tabular-nums">
                    {frameData.thresholds.violationWindowMs / 1000}s
                  </span>
                  <span className="text-gray-500">Object confidence</span>
                  <span className="text-gray-300 tabular-nums">
                    {frameData.thresholds.objectConfidenceThreshold}
                  </span>
                  <span className="text-gray-500">Object interval</span>
                  <span className="text-gray-300 tabular-nums">
                    {frameData.thresholds.objectDetectIntervalMs}ms
                  </span>
                  <span className="text-gray-500">High-conf threshold</span>
                  <span className="text-gray-300 tabular-nums">
                    {frameData.thresholds.highConfidenceThreshold}
                  </span>
                  <span className="text-gray-500">Fast-rise multiplier</span>
                  <span className="text-gray-300 tabular-nums">
                    ×{frameData.thresholds.fastRiseMultiplier}
                  </span>
                  <span className="text-gray-500">Violation ratio</span>
                  <span
                    className="tabular-nums font-bold"
                    style={{ color: `hsl(${(1 - frameData.violationRatio) * 120}, 85%, 55%)` }}
                  >
                    {(frameData.violationRatio * 100).toFixed(0)}% of window
                  </span>
                  <span className="text-gray-500">Score target</span>
                  <span className="text-gray-400 tabular-nums">
                    → {(frameData.violationRatio * 100).toFixed(0)}%
                  </span>
                </div>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </DataCard>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

function PoseBar({
  label,
  value,
  threshold,
  unit,
  precision = 1,
  description,
}: {
  label: string;
  value: number;
  threshold: number;
  unit: string;
  precision?: number;
  description: string;
}) {
  const absVal = Math.abs(value);
  const exceeded = absVal > threshold;
  const pct = Math.min((absVal / (threshold * 2)) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-0.5">
        <span className="text-gray-400">
          {label} <span className="text-gray-600 text-[10px]">({description})</span>
        </span>
        <span className={exceeded ? 'text-red-400 font-bold' : 'text-gray-300'}>
          {value.toFixed(precision)}
          {unit}
          {exceeded && ' ⚠'}
        </span>
      </div>
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-75 ${exceeded ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
        {/* threshold marker */}
        <div className="absolute top-0 h-full w-px bg-amber-400/60" style={{ left: `${50}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>0</span>
        <span className="text-amber-500/80">
          ±{threshold}
          {unit}
        </span>
        <span>
          {threshold * 2}
          {unit}
        </span>
      </div>
    </div>
  );
}

function ScoreGraph({ history }: { history: { time: number; score: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const now = Date.now();
    const windowMs = 30_000;
    const startTime = now - windowMs;

    // Draw threshold lines
    const drawThresholdLine = (score: number, color: string, label: string) => {
      const y = h - score * h;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.fillText(label, w - ctx.measureText(label).width - 4, y - 3);
    };

    drawThresholdLine(0.3, 'rgba(34,197,94,0.4)', 'Safe');
    drawThresholdLine(0.6, 'rgba(234,179,8,0.4)', 'Warning');

    // Draw score line
    ctx.beginPath();
    let started = false;
    for (const point of history) {
      const x = ((point.time - startTime) / windowMs) * w;
      const y = h - point.score * h;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill area under
    if (history.length > 0) {
      const lastPoint = history[history.length - 1];
      const lastX = ((lastPoint.time - startTime) / windowMs) * w;
      ctx.lineTo(lastX, h);
      const firstPoint = history[0];
      const firstX = ((firstPoint.time - startTime) / windowMs) * w;
      ctx.lineTo(firstX, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(129, 140, 248, 0.1)';
      ctx.fill();
    }
  }, [history]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={120}
      className="w-full h-[120px] rounded-lg bg-gray-800/50"
    />
  );
}
