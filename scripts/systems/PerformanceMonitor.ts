/**
 * PerformanceMonitor.ts
 * Real-time performance monitoring and optimization
 * Targets: 60 FPS, <100 draw calls, <200MB memory
 */

import { PERFORMANCE_CONFIG, QualityPreset } from '../utils/Constants';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  drawCalls: number;
  polyCount: number;
  memoryUsage: number; // MB
  batteryDrain: number; // % per hour
  networkLatency: number; // ms
}

export interface PerformanceStats {
  current: PerformanceMetrics;
  average: PerformanceMetrics;
  min: PerformanceMetrics;
  max: PerformanceMetrics;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    polyCount: 0,
    memoryUsage: 0,
    batteryDrain: 0,
    networkLatency: 0
  };

  // Frame tracking
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private readonly FRAME_SAMPLE_SIZE = 60;

  // Quality settings
  private currentQuality: QualityPreset = QualityPreset.AUTO;
  private autoQualityEnabled: boolean = true;

  // Performance history
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly HISTORY_SIZE = 300; // 5 seconds at 60fps

  // Warnings
  private warnings: string[] = [];
  private readonly _WARNING_THRESHOLD = 3; // seconds

  // Battery tracking
  private batteryStartLevel?: number;
  private batteryStartTime?: number;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    this.lastFrameTime = performance.now();

    // Track battery if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryStartLevel = battery.level * 100;
        this.batteryStartTime = Date.now();

        battery.addEventListener('levelchange', () => {
          this.updateBatteryDrain(battery);
        });
      });
    }

    console.log('Performance monitor initialized');
  }

  /**
   * Update frame metrics (call every frame)
   */
  public updateFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;

    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.FRAME_SAMPLE_SIZE) {
      this.frameTimes.shift();
    }

    // Calculate FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.metrics.fps = 1000 / avgFrameTime;
    this.metrics.frameTime = avgFrameTime;

    this.lastFrameTime = now;
    this.frameCount++;

    // Store in history
    this.addToHistory();

    // Check performance
    this.checkPerformance();

    // Auto-adjust quality if enabled
    if (this.autoQualityEnabled) {
      this.adjustQuality();
    }
  }

  /**
   * Update draw calls
   */
  public updateDrawCalls(count: number): void {
    this.metrics.drawCalls = count;
  }

  /**
   * Update polygon count
   */
  public updatePolyCount(count: number): void {
    this.metrics.polyCount = count;
  }

  /**
   * Update memory usage
   */
  public updateMemoryUsage(): void {
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
  }

  /**
   * Update network latency
   */
  public updateNetworkLatency(latency: number): void {
    this.metrics.networkLatency = latency;
  }

  /**
   * Update battery drain
   */
  private updateBatteryDrain(battery: any): void {
    if (!this.batteryStartLevel || !this.batteryStartTime) return;

    const currentLevel = battery.level * 100;
    const drainPercent = this.batteryStartLevel - currentLevel;
    const elapsedHours = (Date.now() - this.batteryStartTime) / (1000 * 60 * 60);

    if (elapsedHours > 0) {
      this.metrics.batteryDrain = drainPercent / elapsedHours;
    }
  }

  /**
   * Add current metrics to history
   */
  private addToHistory(): void {
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > this.HISTORY_SIZE) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Check performance against targets
   */
  private checkPerformance(): void {
    this.warnings = [];

    if (this.metrics.fps < PERFORMANCE_CONFIG.TARGET_FPS * 0.9) {
      this.warnings.push(`Low FPS: ${this.metrics.fps.toFixed(1)} (target: ${PERFORMANCE_CONFIG.TARGET_FPS})`);
    }

    if (this.metrics.frameTime > PERFORMANCE_CONFIG.FRAME_BUDGET * 1.2) {
      this.warnings.push(`High frame time: ${this.metrics.frameTime.toFixed(2)}ms (target: ${PERFORMANCE_CONFIG.FRAME_BUDGET.toFixed(2)}ms)`);
    }

    if (this.metrics.drawCalls > PERFORMANCE_CONFIG.MAX_DRAW_CALLS) {
      this.warnings.push(`Too many draw calls: ${this.metrics.drawCalls} (target: <${PERFORMANCE_CONFIG.MAX_DRAW_CALLS})`);
    }

    if (this.metrics.polyCount > PERFORMANCE_CONFIG.MAX_VISIBLE_POLYS) {
      this.warnings.push(`Too many polygons: ${this.metrics.polyCount} (target: <${PERFORMANCE_CONFIG.MAX_VISIBLE_POLYS})`);
    }

    if (this.metrics.memoryUsage > PERFORMANCE_CONFIG.MAX_TEXTURE_MEMORY / (1024 * 1024)) {
      this.warnings.push(`High memory usage: ${this.metrics.memoryUsage.toFixed(0)}MB (target: <${PERFORMANCE_CONFIG.MAX_TEXTURE_MEMORY / (1024 * 1024)}MB)`);
    }

    if (this.metrics.batteryDrain > PERFORMANCE_CONFIG.BATTERY_DRAIN_TARGET) {
      this.warnings.push(`High battery drain: ${this.metrics.batteryDrain.toFixed(1)}%/hour (target: <${PERFORMANCE_CONFIG.BATTERY_DRAIN_TARGET}%/hour)`);
    }
  }

  /**
   * Auto-adjust quality based on performance
   */
  private adjustQuality(): void {
    const avgFps = this.getAverageFPS();

    if (avgFps < 45 && this.currentQuality !== QualityPreset.LOW) {
      // Performance is poor, lower quality
      this.setQuality(this.lowerQuality(this.currentQuality));
      console.log(`Auto-adjusted quality to: ${this.currentQuality}`);
    } else if (avgFps > 58 && this.currentQuality !== QualityPreset.HIGH) {
      // Performance is good, try higher quality
      const higherQuality = this.raiseQuality(this.currentQuality);
      if (higherQuality !== this.currentQuality) {
        this.setQuality(higherQuality);
        console.log(`Auto-adjusted quality to: ${this.currentQuality}`);
      }
    }
  }

  /**
   * Lower quality preset
   */
  private lowerQuality(current: QualityPreset): QualityPreset {
    switch (current) {
      case QualityPreset.HIGH: return QualityPreset.MEDIUM;
      case QualityPreset.MEDIUM: return QualityPreset.LOW;
      default: return QualityPreset.LOW;
    }
  }

  /**
   * Raise quality preset
   */
  private raiseQuality(current: QualityPreset): QualityPreset {
    switch (current) {
      case QualityPreset.LOW: return QualityPreset.MEDIUM;
      case QualityPreset.MEDIUM: return QualityPreset.HIGH;
      default: return QualityPreset.HIGH;
    }
  }

  /**
   * Set quality preset
   */
  public setQuality(quality: QualityPreset): void {
    this.currentQuality = quality;
    // TODO: Apply quality settings to renderer
    console.log(`Quality set to: ${quality}`);
  }

  /**
   * Enable/disable auto quality adjustment
   */
  public setAutoQuality(enabled: boolean): void {
    this.autoQualityEnabled = enabled;
  }

  /**
   * Get average FPS over last second
   */
  private getAverageFPS(): number {
    const recentMetrics = this.metricsHistory.slice(-60);
    if (recentMetrics.length === 0) return 60;

    const avgFps = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    return avgFps;
  }

  /**
   * Get performance statistics
   */
  public getStats(): PerformanceStats {
    const history = this.metricsHistory;

    if (history.length === 0) {
      return {
        current: this.metrics,
        average: this.metrics,
        min: this.metrics,
        max: this.metrics
      };
    }

    return {
      current: { ...this.metrics },
      average: this.calculateAverage(history),
      min: this.calculateMin(history),
      max: this.calculateMax(history)
    };
  }

  /**
   * Calculate average metrics
   */
  private calculateAverage(history: PerformanceMetrics[]): PerformanceMetrics {
    const sum = history.reduce((acc, m) => ({
      fps: acc.fps + m.fps,
      frameTime: acc.frameTime + m.frameTime,
      drawCalls: acc.drawCalls + m.drawCalls,
      polyCount: acc.polyCount + m.polyCount,
      memoryUsage: acc.memoryUsage + m.memoryUsage,
      batteryDrain: acc.batteryDrain + m.batteryDrain,
      networkLatency: acc.networkLatency + m.networkLatency
    }), {
      fps: 0, frameTime: 0, drawCalls: 0, polyCount: 0,
      memoryUsage: 0, batteryDrain: 0, networkLatency: 0
    });

    const count = history.length;
    return {
      fps: sum.fps / count,
      frameTime: sum.frameTime / count,
      drawCalls: sum.drawCalls / count,
      polyCount: sum.polyCount / count,
      memoryUsage: sum.memoryUsage / count,
      batteryDrain: sum.batteryDrain / count,
      networkLatency: sum.networkLatency / count
    };
  }

  /**
   * Calculate minimum metrics
   */
  private calculateMin(history: PerformanceMetrics[]): PerformanceMetrics {
    return history.reduce((min, m) => ({
      fps: Math.min(min.fps, m.fps),
      frameTime: Math.min(min.frameTime, m.frameTime),
      drawCalls: Math.min(min.drawCalls, m.drawCalls),
      polyCount: Math.min(min.polyCount, m.polyCount),
      memoryUsage: Math.min(min.memoryUsage, m.memoryUsage),
      batteryDrain: Math.min(min.batteryDrain, m.batteryDrain),
      networkLatency: Math.min(min.networkLatency, m.networkLatency)
    }));
  }

  /**
   * Calculate maximum metrics
   */
  private calculateMax(history: PerformanceMetrics[]): PerformanceMetrics {
    return history.reduce((max, m) => ({
      fps: Math.max(max.fps, m.fps),
      frameTime: Math.max(max.frameTime, m.frameTime),
      drawCalls: Math.max(max.drawCalls, m.drawCalls),
      polyCount: Math.max(max.polyCount, m.polyCount),
      memoryUsage: Math.max(max.memoryUsage, m.memoryUsage),
      batteryDrain: Math.max(max.batteryDrain, m.batteryDrain),
      networkLatency: Math.max(max.networkLatency, m.networkLatency)
    }));
  }

  /**
   * Get current warnings
   */
  public getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  public getReport(): string {
    const stats = this.getStats();

    return `
Performance Report:
==================
Current FPS: ${stats.current.fps.toFixed(1)}
Average FPS: ${stats.average.fps.toFixed(1)}
Frame Time: ${stats.current.frameTime.toFixed(2)}ms
Draw Calls: ${stats.current.drawCalls}
Poly Count: ${stats.current.polyCount}
Memory: ${stats.current.memoryUsage.toFixed(0)}MB
Battery Drain: ${stats.current.batteryDrain.toFixed(1)}%/hour
Network Latency: ${stats.current.networkLatency}ms
Quality: ${this.currentQuality}

Warnings:
${this.warnings.length > 0 ? this.warnings.join('\n') : 'None'}
    `.trim();
  }

  /**
   * Reset metrics
   */
  public reset(): void {
    this.frameCount = 0;
    this.frameTimes = [];
    this.metricsHistory = [];
    this.warnings = [];
  }
}
