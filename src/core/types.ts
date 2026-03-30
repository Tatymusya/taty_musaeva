/**
 * Глобальные типы для приложения
 */
import * as THREE from 'three';

// ==========================================
// Типы конфигурации
// ==========================================
export interface AppConfig {
  app: {
    name: string;
    version: string;
    debug: boolean;
  };
  three: ThreeConfig;
  ui: UIConfig;
}

export interface ThreeConfig {
  particleCount: number;
  particleSize: number;
  particleColor: number;
  centralObjectColor: number;
  connectionDistance: number;
  mouseInteractionRadius: number;
  rotationSpeed: number;
  bgColor: number;
  fogDensity: number;
}

export interface UIConfig {
  scrollSensitivity: number;
  animationDuration: number;
  mobileBreakpoint: number;
}

// ==========================================
// Типы для 3D модулей
// ==========================================
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

export interface ScrollState {
  y: number;
  progress: number;
  direction: 'up' | 'down';
}

// ==========================================
// Типы событий
// ==========================================
export type EventType =
  | 'mouse:move'
  | 'scroll'
  | 'resize'
  | 'tick'
  | 'keydown'
  | 'device:capabilities'
  | 'webgl:not-supported'
  | 'webgl:initialized';

export interface CustomEventMap {
  'mouse:move': MousePosition;
  scroll: ScrollState;
  resize: { width: number; height: number };
  tick: { delta: number; time: number };
  keydown: { key: string; code: string };
  'device:capabilities': {
    webgl: boolean;
    webgl2?: boolean;
    lowEndDevice: boolean;
    memory?: number;
    cores?: number;
  };

  'webgl:not-supported': Record<string, string> | undefined;
  'webgl:initialized': {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
  };
}

// ==========================================
// Типы для ModuleLoader
// ==========================================
export interface ModuleInfo {
  name: string;
  init(): Promise<void> | void;
  destroy?(): void;
}

export interface LoadProgress {
  current: number;
  total: number;
  percent: number;
  currentModule: string | null;
  completedModules: string[];
}

// ==========================================
// Типы для модулей
// ==========================================
export interface Module {
  name: string;
  init(): void | Promise<void>;
  destroy?(): void;
}

export interface IRendererModule extends Module {
  getCanvas(): HTMLCanvasElement;
  getSize(): { width: number; height: number };
  getRenderer(): THREE.WebGLRenderer;
  getCamera(): THREE.PerspectiveCamera;
  addRenderCallback(callback: () => void): void;
  removeRenderCallback(callback: () => void): void;
  startAnimationLoop(): void;
  stopAnimationLoop(): void;
  render(scene: THREE.Scene, camera?: THREE.Camera): void;
}

export interface ISceneModule extends Module {
  getScene(): THREE.Scene;
  getCamera(): THREE.PerspectiveCamera;
  render(): void;
}
