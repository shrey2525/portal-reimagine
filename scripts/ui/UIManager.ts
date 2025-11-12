/**
 * UIManager.ts
 * Mobile-optimized UI system with thumb-zone optimization
 */

import { UI_CONFIG, COLORS } from '../utils/Constants';

export enum UIElementType {
  BUTTON = 'button',
  SLIDER = 'slider',
  NOTIFICATION = 'notification',
  PROGRESS_BAR = 'progress_bar',
  ICON = 'icon',
  TEXT = 'text',
  PANEL = 'panel',
  HUD = 'hud'
}

export enum UIPosition {
  TOP_LEFT = 'top_left',
  TOP_CENTER = 'top_center',
  TOP_RIGHT = 'top_right',
  CENTER_LEFT = 'center_left',
  CENTER = 'center',
  CENTER_RIGHT = 'center_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_CENTER = 'bottom_center',
  BOTTOM_RIGHT = 'bottom_right'
}

export enum ThumbZone {
  EASY = 'easy',      // Easy to reach with thumb
  MEDIUM = 'medium',  // Medium reach
  HARD = 'hard'       // Hard to reach
}

export interface UIElement {
  id: string;
  type: UIElementType;
  position: UIPosition;
  thumbZone: ThumbZone;
  visible: boolean;
  enabled: boolean;
  element?: HTMLElement;
}

export interface Button extends UIElement {
  type: UIElementType.BUTTON;
  label: string;
  icon?: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  timestamp: number;
}

export class UIManager {
  private _elements: Map<string, UIElement> = new Map();
  private notifications: Notification[] = [];
  private container?: HTMLElement;

  // HUD elements
  private hudElements: {
    statusBar?: HTMLElement;
    actionBar?: HTMLElement;
    scannerOverlay?: HTMLElement;
    portalCreationUI?: HTMLElement;
    notificationArea?: HTMLElement;
  } = {};

  constructor() {
    this.initialize();
  }

  /**
   * Initialize UI system
   */
  private initialize(): void {
    // Create main container
    this.container = this.createContainer();
    document.body.appendChild(this.container);

    // Create HUD
    this.createHUD();

    console.log('UI Manager initialized');
  }

  /**
   * Create main UI container
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'portalsync-ui';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    return container;
  }

  /**
   * Create main HUD
   */
  private createHUD(): void {
    // Status bar (top)
    this.hudElements.statusBar = this.createStatusBar();

    // Action bar (bottom)
    this.hudElements.actionBar = this.createActionBar();

    // Notification area (top center)
    this.hudElements.notificationArea = this.createNotificationArea();
  }

  /**
   * Create status bar
   */
  private createStatusBar(): HTMLElement {
    const statusBar = document.createElement('div');
    statusBar.id = 'status-bar';
    statusBar.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: linear-gradient(180deg, ${COLORS.BACKGROUND}ee 0%, ${COLORS.BACKGROUND}00 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      pointer-events: auto;
    `;

    // Energy counter
    const energyCounter = this.createText('energy-counter', '0/25', {
      color: COLORS.ENERGY_COMMON,
      fontSize: '18px',
      fontWeight: 'bold'
    });
    statusBar.appendChild(energyCounter);

    // Zone name
    const zoneName = this.createText('zone-name', 'Training Grounds', {
      color: COLORS.TEXT_SECONDARY,
      fontSize: '14px'
    });
    statusBar.appendChild(zoneName);

    // Menu button
    const menuBtn = this.createButton('menu-btn', '☰', () => {
      this.showMenu();
    });
    statusBar.appendChild(menuBtn);

    this.container!.appendChild(statusBar);
    return statusBar;
  }

  /**
   * Create action bar
   */
  private createActionBar(): HTMLElement {
    const actionBar = document.createElement('div');
    actionBar.id = 'action-bar';
    actionBar.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      pointer-events: none;
    `;

    // Scanner toggle (bottom left - easy thumb zone)
    const scannerBtn = this.createIconButton(
      'scanner-btn',
      '👁️',
      () => {
        this.toggleScanner();
      },
      ThumbZone.EASY
    );
    actionBar.appendChild(scannerBtn);

    // Portal creation button (bottom right - easy thumb zone)
    const portalBtn = this.createIconButton(
      'portal-btn',
      '⭕',
      () => {
        this.startPortalCreation();
      },
      ThumbZone.EASY
    );
    actionBar.appendChild(portalBtn);

    this.container!.appendChild(actionBar);
    return actionBar;
  }

  /**
   * Create notification area
   */
  private createNotificationArea(): HTMLElement {
    const area = document.createElement('div');
    area.id = 'notification-area';
    area.style.cssText = `
      position: absolute;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 400px;
      pointer-events: none;
    `;
    this.container!.appendChild(area);
    return area;
  }

  /**
   * Create scanner overlay
   */
  public showScannerOverlay(): void {
    if (this.hudElements.scannerOverlay) {
      this.hudElements.scannerOverlay.style.display = 'block';
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'scanner-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle, ${COLORS.PRIMARY}22 0%, ${COLORS.BACKGROUND}00 70%);
      border: 2px solid ${COLORS.PRIMARY}44;
      border-radius: 50%;
      pointer-events: none;
      animation: scanPulse 2s infinite;
    `;

    // Add scan cone indicator
    const cone = document.createElement('div');
    cone.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background: conic-gradient(
        from 0deg,
        ${COLORS.PRIMARY}00 0deg,
        ${COLORS.PRIMARY}88 30deg,
        ${COLORS.PRIMARY}00 60deg
      );
      border-radius: 50%;
      animation: scanRotate 3s linear infinite;
    `;
    overlay.appendChild(cone);

    // Energy signature counter
    const counter = this.createText('scanner-counter', 'Scanning...', {
      color: COLORS.PRIMARY,
      fontSize: '16px',
      textAlign: 'center',
      marginTop: '20px'
    });
    overlay.appendChild(counter);

    this.container!.appendChild(overlay);
    this.hudElements.scannerOverlay = overlay;

    // Add CSS animations
    this.addScannerAnimations();
  }

  /**
   * Hide scanner overlay
   */
  public hideScannerOverlay(): void {
    if (this.hudElements.scannerOverlay) {
      this.hudElements.scannerOverlay.style.display = 'none';
    }
  }

  /**
   * Show portal creation UI
   */
  public showPortalCreationUI(): void {
    if (this.hudElements.portalCreationUI) {
      this.hudElements.portalCreationUI.style.display = 'block';
      return;
    }

    const ui = document.createElement('div');
    ui.id = 'portal-creation-ui';
    ui.style.cssText = `
      position: absolute;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: ${COLORS.SURFACE}dd;
      border-radius: 20px;
      padding: 20px;
      pointer-events: auto;
      backdrop-filter: blur(10px);
    `;

    // Instructions
    const instructions = this.createText('portal-instructions',
      '🔵 Pinch to scale\n🔄 Rotate to orient\n✏️ Swipe to paint\n✅ Double-tap to activate',
      {
        color: COLORS.TEXT_PRIMARY,
        fontSize: '14px',
        textAlign: 'center',
        whiteSpace: 'pre-line',
        lineHeight: '1.8'
      }
    );
    ui.appendChild(instructions);

    // Cancel button
    const cancelBtn = this.createButton('portal-cancel', 'Cancel', () => {
      this.cancelPortalCreation();
    });
    cancelBtn.style.marginTop = '15px';
    ui.appendChild(cancelBtn);

    this.container!.appendChild(ui);
    this.hudElements.portalCreationUI = ui;
  }

  /**
   * Hide portal creation UI
   */
  public hidePortalCreationUI(): void {
    if (this.hudElements.portalCreationUI) {
      this.hudElements.portalCreationUI.style.display = 'none';
    }
  }

  /**
   * Show notification
   */
  public showNotification(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 3000
  ): void {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    this.notifications.push(notification);
    this.renderNotification(notification);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);
  }

  /**
   * Render notification
   */
  private renderNotification(notification: Notification): void {
    const notifElement = document.createElement('div');
    notifElement.id = notification.id;
    notifElement.style.cssText = `
      background: ${this.getNotificationColor(notification.type)};
      color: ${COLORS.TEXT_PRIMARY};
      padding: 15px 20px;
      border-radius: 12px;
      margin-bottom: 10px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
    `;
    notifElement.textContent = notification.message;

    this.hudElements.notificationArea!.appendChild(notifElement);
  }

  /**
   * Remove notification
   */
  private removeNotification(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => element.remove(), 300);
    }
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * Get notification color
   */
  private getNotificationColor(type: string): string {
    switch (type) {
      case 'success': return COLORS.SUCCESS + 'dd';
      case 'warning': return COLORS.WARNING + 'dd';
      case 'error': return COLORS.ERROR + 'dd';
      default: return COLORS.PRIMARY + 'dd';
    }
  }

  /**
   * Update energy counter
   */
  public updateEnergyCounter(collected: number, total: number): void {
    const counter = document.getElementById('energy-counter');
    if (counter) {
      counter.textContent = `⚡ ${collected}/${total}`;
    }
  }

  /**
   * Update zone name
   */
  public updateZoneName(name: string): void {
    const zoneElement = document.getElementById('zone-name');
    if (zoneElement) {
      zoneElement.textContent = name;
    }
  }

  /**
   * Show progress bar
   */
  public showProgressBar(id: string, progress: number, label?: string): void {
    let bar = document.getElementById(`progress-${id}`);

    if (!bar) {
      bar = document.createElement('div');
      bar.id = `progress-${id}`;
      bar.style.cssText = `
        position: absolute;
        bottom: 150px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        max-width: 300px;
        background: ${COLORS.SURFACE}dd;
        border-radius: 10px;
        padding: 10px;
        pointer-events: none;
      `;
      this.container!.appendChild(bar);
    }

    bar.innerHTML = `
      ${label ? `<div style="color: ${COLORS.TEXT_PRIMARY}; font-size: 12px; margin-bottom: 5px;">${label}</div>` : ''}
      <div style="background: ${COLORS.BACKGROUND}; border-radius: 5px; height: 8px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, ${COLORS.PRIMARY}, ${COLORS.SECONDARY}); height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
      </div>
      <div style="color: ${COLORS.TEXT_SECONDARY}; font-size: 11px; margin-top: 3px; text-align: right;">${Math.round(progress)}%</div>
    `;
  }

  /**
   * Hide progress bar
   */
  public hideProgressBar(id: string): void {
    const bar = document.getElementById(`progress-${id}`);
    if (bar) bar.remove();
  }

  // Helper methods for creating UI elements

  private createButton(id: string, label: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = label;
    button.style.cssText = `
      min-width: ${UI_CONFIG.MIN_TOUCH_TARGET_SIZE}px;
      min-height: ${UI_CONFIG.MIN_TOUCH_TARGET_SIZE}px;
      background: ${COLORS.PRIMARY};
      color: ${COLORS.TEXT_PRIMARY};
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      pointer-events: auto;
      padding: 0 20px;
      transition: all 0.2s;
    `;
    button.onclick = onClick;
    return button;
  }

  private createIconButton(id: string, icon: string, onClick: () => void, _zone: ThumbZone): HTMLElement {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = icon;
    button.style.cssText = `
      width: ${UI_CONFIG.BUTTON_SIZE}px;
      height: ${UI_CONFIG.BUTTON_SIZE}px;
      background: ${COLORS.SURFACE}dd;
      border: 2px solid ${COLORS.PRIMARY};
      border-radius: 50%;
      font-size: ${UI_CONFIG.ICON_SIZE}px;
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    button.onclick = onClick;
    return button;
  }

  private createText(id: string, text: string, styles: any = {}): HTMLElement {
    const element = document.createElement('div');
    element.id = id;
    element.textContent = text;

    const baseStyles = `
      color: ${styles.color || COLORS.TEXT_PRIMARY};
      font-size: ${styles.fontSize || '16px'};
      font-weight: ${styles.fontWeight || 'normal'};
      text-align: ${styles.textAlign || 'left'};
      white-space: ${styles.whiteSpace || 'normal'};
      line-height: ${styles.lineHeight || '1.5'};
      ${styles.marginTop ? `margin-top: ${styles.marginTop};` : ''}
    `;
    element.style.cssText = baseStyles;
    return element;
  }

  /**
   * Add scanner animations
   */
  private addScannerAnimations(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scanPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes scanRotate {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Event handlers (to be connected to GameController)

  private toggleScanner(): void {
    console.log('Toggle scanner');
    // Will be connected to GameController
  }

  private startPortalCreation(): void {
    console.log('Start portal creation');
    // Will be connected to GameController
  }

  private cancelPortalCreation(): void {
    console.log('Cancel portal creation');
    // Will be connected to GameController
  }

  private showMenu(): void {
    console.log('Show menu');
    // Will be connected to GameController
  }

  /**
   * Set event handler
   */
  public setEventHandler(event: string, handler: () => void): void {
    (this as any)[event] = handler;
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}
