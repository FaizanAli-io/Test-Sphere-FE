/**
 * Offline Exam System - Network Monitor
 *
 * Monitors network connectivity and backend reachability.
 * Automatically detects when to switch between online and offline modes.
 */

import { NetworkStatus } from "./types";
import { OFFLINE_CONFIG } from "./config";

type NetworkStatusCallback = (status: NetworkStatus) => void;

export class NetworkMonitor {
  private listeners: Set<NetworkStatusCallback> = new Set();
  private currentStatus: NetworkStatus;
  private healthCheckInterval: number | null = null;
  private backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
    this.currentStatus = {
      isOnline: navigator.onLine,
      isBackendReachable: false,
      lastChecked: new Date().toISOString(),
    };

    this.setupEventListeners();
  }

  /**
   * Set up browser online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      console.log("🌐 Browser detected online status");
      this.checkBackendReachability();
    });

    window.addEventListener("offline", () => {
      console.log("📴 Browser detected offline status");
      this.updateStatus({
        isOnline: false,
        isBackendReachable: false,
        lastChecked: new Date().toISOString(),
      });
    });
  }

  /**
   * Check if backend is reachable
   */
  private async checkBackendReachability(): Promise<boolean> {
    try {
      // Use a lightweight health check endpoint with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.backendUrl}/health`, {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);

      // Accept 200 OK or 404 (endpoint exists but not implemented)
      // Only fail on network errors or 5xx errors
      const isReachable = response.ok || response.status === 404;

      this.updateStatus({
        isOnline: navigator.onLine,
        isBackendReachable: isReachable,
        lastChecked: new Date().toISOString(),
      });

      return isReachable;
    } catch (error) {
      // Backend is not reachable (network error, timeout, etc.)
      console.log("❌ Backend is not reachable:", error);

      this.updateStatus({
        isOnline: navigator.onLine,
        isBackendReachable: false,
        lastChecked: new Date().toISOString(),
      });

      return false;
    }
  }

  /**
   * Update network status and notify listeners
   */
  private updateStatus(newStatus: NetworkStatus): void {
    const statusChanged =
      this.currentStatus.isOnline !== newStatus.isOnline ||
      this.currentStatus.isBackendReachable !== newStatus.isBackendReachable;

    this.currentStatus = newStatus;

    if (statusChanged) {
      console.log("📊 Network status changed:", newStatus);
      this.notifyListeners();
    }
  }

  /**
   * Notify all registered listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error("❌ Error in network status listener:", error);
      }
    });
  }

  /**
   * Start monitoring network status
   */
  public start(): void {
    console.log("🚀 Starting network monitor");

    // Initial check
    this.checkBackendReachability();

    // Set up periodic health checks
    this.healthCheckInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.checkBackendReachability();
      }
    }, OFFLINE_CONFIG.backendHealthCheckIntervalMs);
  }

  /**
   * Stop monitoring network status
   */
  public stop(): void {
    console.log("🛑 Stopping network monitor");

    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Subscribe to network status changes
   */
  public subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);

    // Immediately call with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current network status
   */
  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Manually trigger a backend reachability check
   */
  public async checkNow(): Promise<NetworkStatus> {
    await this.checkBackendReachability();
    return this.getStatus();
  }

  /**
   * Check if system should operate in offline mode
   */
  public isOfflineMode(): boolean {
    return !this.currentStatus.isOnline || !this.currentStatus.isBackendReachable;
  }
}

// Singleton instance
let networkMonitorInstance: NetworkMonitor | null = null;

/**
 * Get the singleton NetworkMonitor instance
 */
export function getNetworkMonitor(backendUrl?: string): NetworkMonitor {
  if (!networkMonitorInstance) {
    if (!backendUrl) {
      throw new Error("Backend URL is required for first initialization");
    }
    networkMonitorInstance = new NetworkMonitor(backendUrl);
  }
  return networkMonitorInstance;
}
