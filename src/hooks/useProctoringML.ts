/**
 * useProctoringML — Lightweight AI proctoring hook
 *
 * Uses @mediapipe/tasks-vision FaceLandmarker to detect:
 *   • Gaze direction (iris position ratio within eye socket)
 *   • Head pose (pitch, yaw, roll from face landmarks)
 *
 * Implements a "leaky bucket" algorithm for a riskScore (0.0 – 1.0):
 *   • Increments when gaze/head pose exceed thresholds
 *   • Slowly decrements ("leaks") when no violations are detected
 *
 * Emits `proctoring_update` via Socket.IO every 500 ms with processed flags.
 * Uses requestAnimationFrame so ML never blocks WebRTC encoding.
 */

import { useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
import type { Socket } from 'socket.io-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProctoringFlags {
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down';
  headPose: { pitch: number; yaw: number };
  faceDetected: boolean;
}

export interface DetectedObject {
  label: string;
  score: number;
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface ProctoringUpdate {
  studentId: string;
  score: number;
  flags: string[];
  gazeDelta: { x: number; y: number };
  headPose: { pitch: number; yaw: number };
  faceDetected: boolean;
  detectedObjects: DetectedObject[];
  suspiciousObjects: DetectedObject[];
  personCount: number;
  extraPeopleCount: number;
  timestamp: number;
}

export interface ProctoringFrameData {
  score: number;
  violationRatio: number; // fraction of frames in rolling window that had violations
  flags: string[];
  gazeDelta: { x: number; y: number };
  gazeDirection: ProctoringFlags['gazeDirection'];
  headPose: { pitch: number; yaw: number };
  faceDetected: boolean;
  detectedObjects: DetectedObject[];
  suspiciousObjects: DetectedObject[];
  personCount: number;
  extraPeopleCount: number;
  landmarks: { x: number; y: number; z: number }[] | null;
  thresholds: {
    yaw: number;
    pitch: number;
    pitchDownThreshold: number;
    pitchUpThreshold: number;
    irisOffCenterX: number;
    irisOffCenterY: number;
    riskRisePerSecond: number;
    riskLeakPerSecond: number;
    violationWindowMs: number;
    objectConfidenceThreshold: number;
    objectDetectIntervalMs: number;
    highConfidenceThreshold: number;
    fastRiseMultiplier: number;
  };
}

interface UseProctoringMLProps {
  videoElement: HTMLVideoElement | null;
  socket?: Socket | null;
  studentId?: string;
  enabled: boolean;
  onFrame?: (data: ProctoringFrameData) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const YAW_THRESHOLD = 35; // degrees — beyond this is suspicious
const PITCH_THRESHOLD = 25;
const PITCH_DOWN_THRESHOLD = 10; // pitch > this = looking down
const PITCH_UP_THRESHOLD = -15; // pitch < this = looking up
const IRIS_OFF_CENTER_X = 0.32; // horizontal iris threshold (eye is wide, ~0.32 reachable)

// ─── Leaky-bucket timing (all time-based, not frame-rate dependent) ──────────
// Rise: score climbs toward the sustained violation ratio at this rate per second
//   e.g. 0.05/s → takes 20 seconds of 100% violations to go from 0 → 1.0
// Fall: score drops at this rate per second when clean
//   e.g. 1/60 → takes exactly 60 seconds to drain from 1.0 → 0.0
const RISK_RISE_PER_SECOND = 0.05; // max climb speed (per second)
const RISK_LEAK_PER_SECOND = 1 / 60; // drain speed (per second) → 60s to empty
const FAST_RISE_MULTIPLIER = 10;
const HIGH_CONFIDENCE_THRESHOLD = 0.4;

// Rolling window for sustained violation ratio (milliseconds)
// The score target is the fraction of frames that had violations in this window.
// Longer window = more stable, less reactive to brief glances.
const VIOLATION_WINDOW_MS = 15_000; // 15-second rolling window
const OBJECT_CONFIDENCE_THRESHOLD = 0.4;
const OBJECT_DETECT_INTERVAL_MS = 900;
const OBJECT_MAX_RESULTS = 8;

const EMIT_INTERVAL_MS = 500;

const SUSPICIOUS_OBJECT_LABELS = new Set([
  'cell phone',
  'mobile phone',
  'phone',
  'smartphone',
  'tablet',
  'laptop',
  'remote',
  'tv',
  'keyboard',
  'mouse',
  'book',
]);

// ─── Face Landmark Indices ───────────────────────────────────────────────────
// Subset of the 468 MediaPipe face mesh landmarks used for head pose estimation.
// These 6 points approximate nose tip, chin, left/right eye outer corner, and
// left/right mouth corner — sufficient for a PnP-style Euler angle estimate.

const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_OUTER = 33;

// Iris landmarks (from the 478-point model with iris refinement)
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;

// Eye socket corners for iris ratio
const LEFT_EYE_INNER = 362;
const LEFT_EYE_OUTER_SOCKET = 263;
const RIGHT_EYE_INNER = 133;
const RIGHT_EYE_OUTER_SOCKET = 33;

function normalizeObjectLabel(label: string): string {
  return label.trim().toLowerCase();
}

function toFlagSuffix(label: string): string {
  return normalizeObjectLabel(label)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ─── Head Pose Estimation (simplified Euler from landmarks) ──────────────────

function estimateHeadPose(landmarks: { x: number; y: number; z: number }[]): {
  pitch: number;
  yaw: number;
} {
  const nose = landmarks[NOSE_TIP];
  const chin = landmarks[CHIN];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;

  // Yaw — horizontal rotation: nose deviation from eye midpoint, scaled by eye width
  const yawRatio = (nose.x - eyeMidX) / Math.max(Math.abs(leftEye.x - rightEye.x), 0.001);
  const yaw = yawRatio * 90;

  // Pitch — nose tip moves relative to eye midpoint due to 3D foreshortening:
  //   looking up  → nose rises relative to eyes → noseOffset shrinks → negative pitch
  //   looking down → nose drops relative to eyes → noseOffset grows  → positive pitch
  const faceHeight = Math.abs(chin.y - eyeMidY);
  const noseOffset = (nose.y - eyeMidY) / Math.max(faceHeight, 0.001);
  const pitch = (noseOffset - 0.35) * 120;

  return { pitch, yaw };
}

// ─── Iris Gaze Estimation ────────────────────────────────────────────────────

function estimateGaze(
  landmarks: { x: number; y: number; z: number }[],
  pitch: number,
): {
  direction: ProctoringFlags['gazeDirection'];
  dx: number;
  dy: number;
} {
  // If iris landmarks aren't available, fall back to "center"
  if (landmarks.length < 478) {
    return { direction: 'center', dx: 0, dy: 0 };
  }

  const leftIris = landmarks[LEFT_IRIS_CENTER];
  const rightIris = landmarks[RIGHT_IRIS_CENTER];

  // Compute horizontal ratio for each eye: 0 = inner corner, 1 = outer corner
  const leftInner = landmarks[LEFT_EYE_INNER];
  const leftOuter = landmarks[LEFT_EYE_OUTER_SOCKET];
  const rightInner = landmarks[RIGHT_EYE_INNER];
  const rightOuter = landmarks[RIGHT_EYE_OUTER_SOCKET];

  const leftEyeWidth = Math.abs(leftOuter.x - leftInner.x);
  const rightEyeWidth = Math.abs(rightOuter.x - rightInner.x);

  // Iris position ratio: 0.5 = centered
  const leftRatioX =
    leftEyeWidth > 0.001 ? (leftIris.x - Math.min(leftInner.x, leftOuter.x)) / leftEyeWidth : 0.5;
  const rightRatioX =
    rightEyeWidth > 0.001
      ? (rightIris.x - Math.min(rightInner.x, rightOuter.x)) / rightEyeWidth
      : 0.5;

  const avgRatioX = (leftRatioX + rightRatioX) / 2;

  // Vertical component: use iris Y relative to eye top/bottom
  const leftTop = landmarks[386];
  const leftBottom = landmarks[374];
  const rightTop = landmarks[159];
  const rightBottom = landmarks[145];

  const leftEyeHeight = Math.abs(leftBottom.y - leftTop.y);
  const rightEyeHeight = Math.abs(rightBottom.y - rightTop.y);

  const leftRatioY =
    leftEyeHeight > 0.001 ? (leftIris.y - Math.min(leftTop.y, leftBottom.y)) / leftEyeHeight : 0.5;
  const rightRatioY =
    rightEyeHeight > 0.001
      ? (rightIris.y - Math.min(rightTop.y, rightBottom.y)) / rightEyeHeight
      : 0.5;

  const avgRatioY = (leftRatioY + rightRatioY) / 2;

  // Delta from center (0.5)
  const dx = avgRatioX - 0.5;
  const dy = avgRatioY - 0.5;

  let direction: ProctoringFlags['gazeDirection'] = 'center';
  if (Math.abs(dx) > IRIS_OFF_CENTER_X) {
    direction = dx > 0 ? 'right' : 'left';
  } else if (pitch > PITCH_DOWN_THRESHOLD) {
    direction = 'down';
  } else if (pitch < PITCH_UP_THRESHOLD) {
    direction = 'up';
  }

  return { direction, dx, dy };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProctoringML({
  videoElement,
  socket,
  studentId,
  enabled,
  onFrame,
}: UseProctoringMLProps) {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const rafIdRef = useRef<number>(0);
  const riskScoreRef = useRef(0);
  const lastEmitRef = useRef(0);
  const initializingRef = useRef(false);
  const objectInitializingRef = useRef(false);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  // Mutable refs for volatile props — updated every render so the detect loop
  // always reads the latest values without needing to recreate the callback.
  const socketRef = useRef(socket);
  socketRef.current = socket;
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;
  const videoElementRef = useRef(videoElement);
  videoElementRef.current = videoElement;

  // Rolling violation history: array of { timestamp, violated: boolean }
  // Used to compute a sustained violation ratio over VIOLATION_WINDOW_MS.
  const violationHistoryRef = useRef<{ t: number; v: boolean }[]>([]);
  // Track last frame timestamp for delta-time calculation
  const lastFrameTimeRef = useRef<number>(0);
  const lastProcessedVideoTimeRef = useRef<number>(-1);
  const lastObjectDetectRef = useRef<number>(0);
  const latestObjectsRef = useRef<DetectedObject[]>([]);
  const latestObjectStatsRef = useRef({ personCount: 0, extraPeopleCount: 0 });

  // Initialize FaceLandmarker
  const initialize = useCallback(async () => {
    if ((landmarkerRef.current && objectDetectorRef.current) || initializingRef.current) return;
    initializingRef.current = true;
    objectInitializingRef.current = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );

      if (!landmarkerRef.current) {
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
      }

      if (!objectDetectorRef.current) {
        objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
            delegate: 'GPU',
          },
          scoreThreshold: OBJECT_CONFIDENCE_THRESHOLD,
          runningMode: 'VIDEO',
          maxResults: OBJECT_MAX_RESULTS,
        });
      }
    } catch (err) {
      console.warn(
        '[ProctoringML] Failed to initialize ML models on GPU, falling back to CPU:',
        err,
      );
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );

        if (!landmarkerRef.current) {
          landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
          });
        }

        if (!objectDetectorRef.current) {
          objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
              delegate: 'CPU',
            },
            scoreThreshold: OBJECT_CONFIDENCE_THRESHOLD,
            runningMode: 'VIDEO',
            maxResults: OBJECT_MAX_RESULTS,
          });
        }
      } catch (cpuErr) {
        console.error('[ProctoringML] ML model initialization failed entirely:', cpuErr);
      }
    } finally {
      initializingRef.current = false;
      objectInitializingRef.current = false;
    }
  }, []);

  // Main detection loop via requestAnimationFrame.
  // Uses refs for all volatile values so this callback never needs to recreate,
  // which would restart the RAF loop and cause missed frames or stale closures.
  const detect = useCallback(() => {
    const videoEl = videoElementRef.current;
    if (!videoEl || !landmarkerRef.current) {
      rafIdRef.current = requestAnimationFrame(detect);
      return;
    }

    // Ensure the video is actually playing with valid dimensions
    if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      rafIdRef.current = requestAnimationFrame(detect);
      return;
    }

    const now = performance.now();
    const frameVideoTime = videoEl.currentTime;
    if (!Number.isFinite(frameVideoTime) || frameVideoTime <= 0) {
      rafIdRef.current = requestAnimationFrame(detect);
      return;
    }

    if (frameVideoTime === lastProcessedVideoTimeRef.current) {
      rafIdRef.current = requestAnimationFrame(detect);
      return;
    }
    lastProcessedVideoTimeRef.current = frameVideoTime;

    const frameTimestampMs = Math.floor(frameVideoTime * 1000);

    // Run face detection
    let result: ReturnType<FaceLandmarker['detectForVideo']>;
    try {
      result = landmarkerRef.current.detectForVideo(videoEl, frameTimestampMs);
    } catch (err) {
      console.warn('[ProctoringML] Face detection frame failed:', err);
      rafIdRef.current = requestAnimationFrame(detect);
      return;
    }
    const faceDetected = result.faceLandmarks && result.faceLandmarks.length > 0;

    const flags: string[] = [];
    let gazeDir: ProctoringFlags['gazeDirection'] = 'center';
    let gazeDelta = { x: 0, y: 0 };
    let headPose = { pitch: 0, yaw: 0 };

    if (
      objectDetectorRef.current &&
      now - lastObjectDetectRef.current >= OBJECT_DETECT_INTERVAL_MS &&
      !objectInitializingRef.current
    ) {
      try {
        const objectResult = objectDetectorRef.current.detectForVideo(videoEl, frameTimestampMs);
        const detections = objectResult.detections ?? [];

        const detectedObjects = detections
          .map((detection) => {
            const firstCategory = detection.categories?.[0];
            const label = firstCategory?.categoryName ?? 'unknown';
            const score = firstCategory?.score ?? 0;
            const box = detection.boundingBox;
            return {
              label,
              score,
              bbox: box
                ? {
                    x: box.originX ?? 0,
                    y: box.originY ?? 0,
                    width: box.width ?? 0,
                    height: box.height ?? 0,
                  }
                : undefined,
            };
          })
          .filter((item) => item.score >= OBJECT_CONFIDENCE_THRESHOLD)
          .sort((a, b) => b.score - a.score);

        const personCount = detectedObjects.filter(
          (item) => normalizeObjectLabel(item.label) === 'person',
        ).length;

        latestObjectsRef.current = detectedObjects;
        latestObjectStatsRef.current = {
          personCount,
          extraPeopleCount: Math.max(personCount - 1, 0),
        };
        lastObjectDetectRef.current = now;
      } catch (objectErr) {
        console.warn('[ProctoringML] Object detection frame failed:', objectErr);
      }
    }

    const objectFlags = new Set<string>();
    const suspiciousObjects = latestObjectsRef.current.filter((item) => {
      const normalized = normalizeObjectLabel(item.label);
      return normalized !== 'person' && SUSPICIOUS_OBJECT_LABELS.has(normalized);
    });

    for (const item of suspiciousObjects) {
      const suffix = toFlagSuffix(item.label);
      if (suffix) objectFlags.add(`object_${suffix}`);
    }

    if (latestObjectStatsRef.current.extraPeopleCount > 0) {
      objectFlags.add('extra_person');
    }

    const highConfidenceSuspiciousObject = suspiciousObjects.some(
      (item) => item.score >= HIGH_CONFIDENCE_THRESHOLD,
    );
    const highConfidencePersonCount = latestObjectsRef.current.filter(
      (item) =>
        normalizeObjectLabel(item.label) === 'person' && item.score >= HIGH_CONFIDENCE_THRESHOLD,
    ).length;
    const highConfidenceExtraPerson = highConfidencePersonCount > 1;
    const highConfidenceObjectViolation =
      highConfidenceSuspiciousObject || highConfidenceExtraPerson;

    if (faceDetected) {
      const landmarks = result.faceLandmarks[0];

      // Head pose
      headPose = estimateHeadPose(landmarks);

      // Gaze
      const gaze = estimateGaze(landmarks, headPose.pitch);
      gazeDir = gaze.direction;
      gazeDelta = { x: gaze.dx, y: gaze.dy };

      // Determine violations
      let hasViolation = false;

      if (Math.abs(headPose.yaw) > YAW_THRESHOLD) {
        flags.push(headPose.yaw > 0 ? 'head_right' : 'head_left');
        hasViolation = true;
      }
      if (Math.abs(headPose.pitch) > PITCH_THRESHOLD) {
        flags.push(headPose.pitch > 0 ? 'head_down' : 'head_up');
        hasViolation = true;
      }
      if (gazeDir !== 'center') {
        flags.push(`gaze_${gazeDir}`);
        hasViolation = true;
      }

      if (objectFlags.size > 0) {
        hasViolation = true;
      }

      // Record violation for this frame
      violationHistoryRef.current.push({ t: now, v: hasViolation });
    } else {
      // No face = suspicious (counts as a violation)
      flags.push('no_face');
      violationHistoryRef.current.push({ t: now, v: true });
    }

    if (objectFlags.size > 0) {
      flags.push(...objectFlags);
    }

    const uniqueFlags = Array.from(new Set(flags));

    // ── Time-based leaky bucket ───────────────────────────────────────────
    // Prune history older than the rolling window
    const cutoff = now - VIOLATION_WINDOW_MS;
    const hist = violationHistoryRef.current;
    const firstValid = hist.findIndex((e) => e.t >= cutoff);
    if (firstValid > 0) violationHistoryRef.current = hist.slice(firstValid);

    // Compute sustained violation ratio over the window
    const windowFrames = violationHistoryRef.current.length;
    const violatedFrames = violationHistoryRef.current.filter((e) => e.v).length;
    const violationRatio = windowFrames > 0 ? violatedFrames / windowFrames : 0;

    // Delta time in seconds since last frame (clamped to avoid huge jumps on tab restore)
    const dtSec =
      lastFrameTimeRef.current > 0 ? Math.min((now - lastFrameTimeRef.current) / 1000, 0.1) : 0;
    lastFrameTimeRef.current = now;

    // The score moves towards violationRatio but is rate-limited
    const target = violationRatio;
    if (target > riskScoreRef.current) {
      // Rising: accelerated for high-confidence suspicious object / extra-person detections
      const risePerSecond = highConfidenceObjectViolation
        ? RISK_RISE_PER_SECOND * FAST_RISE_MULTIPLIER
        : RISK_RISE_PER_SECOND;
      riskScoreRef.current = Math.min(target, riskScoreRef.current + risePerSecond * dtSec);
    } else {
      // Falling (leaking): always leaks at RISK_LEAK_PER_SECOND regardless of target
      riskScoreRef.current = Math.max(target, riskScoreRef.current - RISK_LEAK_PER_SECOND * dtSec);
    }

    // Fire onFrame callback every frame for debug consumers
    if (onFrameRef.current) {
      onFrameRef.current({
        score: riskScoreRef.current,
        violationRatio,
        flags: uniqueFlags,
        gazeDelta,
        gazeDirection: gazeDir,
        headPose,
        faceDetected: !!faceDetected,
        detectedObjects: latestObjectsRef.current,
        suspiciousObjects,
        personCount: latestObjectStatsRef.current.personCount,
        extraPeopleCount: latestObjectStatsRef.current.extraPeopleCount,
        landmarks: faceDetected ? result.faceLandmarks[0] : null,
        thresholds: {
          yaw: YAW_THRESHOLD,
          pitch: PITCH_THRESHOLD,
          pitchDownThreshold: PITCH_DOWN_THRESHOLD,
          pitchUpThreshold: PITCH_UP_THRESHOLD,
          irisOffCenterX: IRIS_OFF_CENTER_X,
          irisOffCenterY: 0, // not used for gaze direction anymore, kept for reference
          riskRisePerSecond: RISK_RISE_PER_SECOND,
          riskLeakPerSecond: RISK_LEAK_PER_SECOND,
          violationWindowMs: VIOLATION_WINDOW_MS,
          objectConfidenceThreshold: OBJECT_CONFIDENCE_THRESHOLD,
          objectDetectIntervalMs: OBJECT_DETECT_INTERVAL_MS,
          highConfidenceThreshold: HIGH_CONFIDENCE_THRESHOLD,
          fastRiseMultiplier: FAST_RISE_MULTIPLIER,
        },
      });
    }

    // Emit via socket at the configured interval
    const sock = socketRef.current;
    if (sock?.connected && now - lastEmitRef.current >= EMIT_INTERVAL_MS) {
      lastEmitRef.current = now;
      const payload: ProctoringUpdate = {
        studentId: studentIdRef.current ?? '',
        score: Math.round(riskScoreRef.current * 100) / 100,
        flags: uniqueFlags,
        gazeDelta,
        headPose: {
          pitch: Math.round(headPose.pitch),
          yaw: Math.round(headPose.yaw),
        },
        faceDetected: !!faceDetected,
        detectedObjects: latestObjectsRef.current,
        suspiciousObjects,
        personCount: latestObjectStatsRef.current.personCount,
        extraPeopleCount: latestObjectStatsRef.current.extraPeopleCount,
        timestamp: Math.floor(Date.now() / 1000),
      };
      sock.emit('proctoring_update', payload);
    }

    rafIdRef.current = requestAnimationFrame(detect);
  }, []); // no deps — reads all volatile values via refs

  // Lifecycle: init + run loop when enabled.
  // detect is stable (no deps), so the loop only restarts when enabled toggles.
  useEffect(() => {
    if (!enabled) return;

    initialize().then(() => {
      rafIdRef.current = requestAnimationFrame(detect);
    });

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [enabled, initialize, detect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (objectDetectorRef.current) {
        objectDetectorRef.current.close();
        objectDetectorRef.current = null;
      }
    };
  }, []);
}
