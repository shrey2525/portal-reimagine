/**
 * InputController.ts
 * Handles multi-touch gesture recognition for mobile devices
 * Recognizes 10+ gesture types for portal manipulation
 */

import { GestureType, GESTURE_THRESHOLDS } from '../utils/Constants';

export interface TouchPoint {
  id: number;
  position: Vector2;
  startPosition: Vector2;
  deltaPosition: Vector2;
  velocity: Vector2;
  timestamp: number;
  startTime: number;
  duration: number;
  tapCount: number;
}

export interface GestureEvent {
  type: GestureType;
  touchPoints: TouchPoint[];
  position: Vector2;
  delta?: Vector2;
  scale?: number;
  rotation?: number;
  velocity?: Vector2;
}

export type GestureCallback = (event: GestureEvent) => void;

export class InputController {
  private touchPoints: Map<number, TouchPoint> = new Map();
  private gestureCallbacks: Map<GestureType, GestureCallback[]> = new Map();

  // Gesture state tracking
  private lastTapTime: number = 0;
  private lastTapPosition?: Vector2;
  private tapCount: number = 0;

  // Pinch/zoom state
  private initialPinchDistance: number = 0;
  private _currentPinchScale: number = 1.0;

  // Rotation state
  private initialRotationAngle: number = 0;
  private _currentRotationAngle: number = 0;

  // Swipe tracking
  private swipePoints: Vector2[] = [];

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize touch event listeners
   */
  private initializeEventListeners(): void {
    // Check if we're in a browser environment
    if (typeof document !== 'undefined') {
      document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
      document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
      document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
      document.addEventListener('touchcancel', this.onTouchCancel.bind(this), { passive: false });
    }

    // Meta Horizon Worlds API hooks (if available)
    // TODO: Implement Meta Horizon input event listeners
  }

  /**
   * Handle touch start event
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();

    Array.from(event.changedTouches).forEach(touch => {
      const position = new Vector2(touch.clientX, touch.clientY);

      const touchPoint: TouchPoint = {
        id: touch.identifier,
        position: position,
        startPosition: position,
        deltaPosition: new Vector2(0, 0),
        velocity: new Vector2(0, 0),
        timestamp: currentTime,
        startTime: currentTime,
        duration: 0,
        tapCount: 0
      };

      this.touchPoints.set(touch.identifier, touchPoint);
    });

    // Detect multi-touch gestures
    if (this.touchPoints.size === 2) {
      this.initializePinchGesture();
      this.initializeRotationGesture();
    }

    // Clear swipe points
    this.swipePoints = [];
  }

  /**
   * Handle touch move event
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();

    Array.from(event.changedTouches).forEach(touch => {
      const touchPoint = this.touchPoints.get(touch.identifier);
      if (!touchPoint) return;

      const newPosition = new Vector2(touch.clientX, touch.clientY);
      const deltaPosition = Vector2.subtract(newPosition, touchPoint.position);

      // Calculate velocity
      const deltaTime = (currentTime - touchPoint.timestamp) / 1000; // seconds
      const velocity = deltaTime > 0
        ? new Vector2(deltaPosition.x / deltaTime, deltaPosition.y / deltaTime)
        : new Vector2(0, 0);

      // Update touch point
      touchPoint.position = newPosition;
      touchPoint.deltaPosition = deltaPosition;
      touchPoint.velocity = velocity;
      touchPoint.timestamp = currentTime;
      touchPoint.duration = currentTime - touchPoint.startTime;

      // Track swipe points
      this.swipePoints.push(newPosition);
      if (this.swipePoints.length > 50) {
        this.swipePoints.shift(); // Keep last 50 points
      }
    });

    // Recognize gestures during movement
    this.recognizeContinuousGestures();
  }

  /**
   * Handle touch end event
   */
  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();

    Array.from(event.changedTouches).forEach(touch => {
      const touchPoint = this.touchPoints.get(touch.identifier);
      if (!touchPoint) return;

      touchPoint.duration = currentTime - touchPoint.startTime;

      // Recognize discrete gestures
      this.recognizeDiscreteGestures(touchPoint);

      // Remove touch point
      this.touchPoints.delete(touch.identifier);
    });

    // Reset multi-touch gesture state
    if (this.touchPoints.size < 2) {
      this.initialPinchDistance = 0;
      this.initialRotationAngle = 0;
    }
  }

  /**
   * Handle touch cancel event
   */
  private onTouchCancel(event: TouchEvent): void {
    Array.from(event.changedTouches).forEach(touch => {
      this.touchPoints.delete(touch.identifier);
    });
  }

  /**
   * Recognize continuous gestures (during touch move)
   */
  private recognizeContinuousGestures(): void {
    const touchArray = Array.from(this.touchPoints.values());

    if (touchArray.length === 1) {
      // Single touch swipe
      const touch = touchArray[0];

      if (touch.velocity.magnitude() > GESTURE_THRESHOLDS.SWIPE_VELOCITY_THRESHOLD) {
        this.emitGesture({
          type: GestureType.SWIPE,
          touchPoints: touchArray,
          position: touch.position,
          velocity: touch.velocity,
          delta: touch.deltaPosition
        });
      }
    } else if (touchArray.length === 2) {
      // Pinch/zoom gesture
      this.recognizePinchGesture(touchArray);

      // Rotation gesture
      this.recognizeRotationGesture(touchArray);
    }
  }

  /**
   * Recognize discrete gestures (on touch end)
   */
  private recognizeDiscreteGestures(touchPoint: TouchPoint): void {
    // Tap detection
    if (touchPoint.duration < GESTURE_THRESHOLDS.TAP_DURATION) {
      const distanceMoved = Vector2.distance(touchPoint.position, touchPoint.startPosition);

      if (distanceMoved < 10) { // Small threshold for tap
        this.recognizeTap(touchPoint);
      }
    }

    // Long press detection
    if (touchPoint.duration > GESTURE_THRESHOLDS.LONG_PRESS_DURATION) {
      this.emitGesture({
        type: GestureType.LONG_PRESS,
        touchPoints: [touchPoint],
        position: touchPoint.position
      });
    }
  }

  /**
   * Recognize tap and double-tap
   */
  private recognizeTap(touchPoint: TouchPoint): void {
    const currentTime = Date.now();

    // Check for double-tap
    if (
      this.lastTapPosition &&
      Vector2.distance(touchPoint.position, this.lastTapPosition) < 30 &&
      currentTime - this.lastTapTime < GESTURE_THRESHOLDS.DOUBLE_TAP_INTERVAL
    ) {
      this.tapCount++;

      if (this.tapCount === 2) {
        // Double-tap detected
        this.emitGesture({
          type: GestureType.DOUBLE_TAP,
          touchPoints: [touchPoint],
          position: touchPoint.position
        });

        this.tapCount = 0;
      }
    } else {
      // Single tap
      this.tapCount = 1;

      // Emit single tap after delay to check for double-tap
      setTimeout(() => {
        if (this.tapCount === 1) {
          this.emitGesture({
            type: GestureType.TAP,
            touchPoints: [touchPoint],
            position: touchPoint.position
          });
        }
      }, GESTURE_THRESHOLDS.DOUBLE_TAP_INTERVAL);
    }

    this.lastTapTime = currentTime;
    this.lastTapPosition = touchPoint.position;
  }

  /**
   * Initialize pinch gesture
   */
  private initializePinchGesture(): void {
    const touchArray = Array.from(this.touchPoints.values());
    if (touchArray.length === 2) {
      this.initialPinchDistance = Vector2.distance(
        touchArray[0].position,
        touchArray[1].position
      );
      this._currentPinchScale = 1.0;
    }
  }

  /**
   * Recognize pinch/zoom gesture
   */
  private recognizePinchGesture(touchArray: TouchPoint[]): void {
    if (touchArray.length !== 2) return;

    const currentDistance = Vector2.distance(
      touchArray[0].position,
      touchArray[1].position
    );

    if (this.initialPinchDistance === 0) {
      this.initialPinchDistance = currentDistance;
      return;
    }

    const distanceDelta = Math.abs(currentDistance - this.initialPinchDistance);

    if (distanceDelta > GESTURE_THRESHOLDS.PINCH_THRESHOLD) {
      const scale = currentDistance / this.initialPinchDistance;
      this._currentPinchScale = scale;

      const gestureType = scale > 1.0 ? GestureType.ZOOM : GestureType.PINCH;

      const midpoint = Vector2.midpoint(touchArray[0].position, touchArray[1].position);

      this.emitGesture({
        type: gestureType,
        touchPoints: touchArray,
        position: midpoint,
        scale: scale
      });
    }
  }

  /**
   * Initialize rotation gesture
   */
  private initializeRotationGesture(): void {
    const touchArray = Array.from(this.touchPoints.values());
    if (touchArray.length === 2) {
      this.initialRotationAngle = this.calculateAngle(
        touchArray[0].position,
        touchArray[1].position
      );
      this._currentRotationAngle = 0;
    }
  }

  /**
   * Recognize rotation gesture
   */
  private recognizeRotationGesture(touchArray: TouchPoint[]): void {
    if (touchArray.length !== 2) return;

    const currentAngle = this.calculateAngle(
      touchArray[0].position,
      touchArray[1].position
    );

    if (this.initialRotationAngle === null) {
      this.initialRotationAngle = currentAngle;
      return;
    }

    let angleDelta = currentAngle - this.initialRotationAngle;

    // Normalize angle to -180 to 180
    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;

    if (Math.abs(angleDelta) > GESTURE_THRESHOLDS.ROTATION_THRESHOLD) {
      this._currentRotationAngle = angleDelta;

      const midpoint = Vector2.midpoint(touchArray[0].position, touchArray[1].position);

      this.emitGesture({
        type: GestureType.ROTATE,
        touchPoints: touchArray,
        position: midpoint,
        rotation: angleDelta
      });
    }
  }

  /**
   * Calculate angle between two points
   */
  private calculateAngle(point1: Vector2, point2: Vector2): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Emit gesture event to callbacks
   */
  private emitGesture(event: GestureEvent): void {
    const callbacks = this.gestureCallbacks.get(event.type) || [];
    callbacks.forEach(callback => callback(event));
  }

  /**
   * Register callback for gesture type
   */
  public on(gestureType: GestureType, callback: GestureCallback): void {
    if (!this.gestureCallbacks.has(gestureType)) {
      this.gestureCallbacks.set(gestureType, []);
    }
    this.gestureCallbacks.get(gestureType)!.push(callback);
  }

  /**
   * Unregister callback for gesture type
   */
  public off(gestureType: GestureType, callback: GestureCallback): void {
    const callbacks = this.gestureCallbacks.get(gestureType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Get current touch points
   */
  public getTouchPoints(): TouchPoint[] {
    return Array.from(this.touchPoints.values());
  }

  /**
   * Get swipe trail points
   */
  public getSwipePoints(): Vector2[] {
    return [...this.swipePoints];
  }

  /**
   * Clear all touch points
   */
  public clear(): void {
    this.touchPoints.clear();
    this.swipePoints = [];
  }

  /**
   * Cleanup event listeners
   */
  public dispose(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('touchstart', this.onTouchStart.bind(this));
      document.removeEventListener('touchmove', this.onTouchMove.bind(this));
      document.removeEventListener('touchend', this.onTouchEnd.bind(this));
      document.removeEventListener('touchcancel', this.onTouchCancel.bind(this));
    }
  }
}

// Vector2 utility class
class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  static subtract(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static midpoint(a: Vector2, b: Vector2): Vector2 {
    return new Vector2((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalized(): Vector2 {
    const mag = this.magnitude();
    return mag > 0 ? new Vector2(this.x / mag, this.y / mag) : new Vector2(0, 0);
  }
}
