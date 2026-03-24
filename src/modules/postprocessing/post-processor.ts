// src/modules/postprocessing/post-processor.ts
import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  //BloomEffect,
  BrightnessContrastEffect,
  FXAAEffect,
} from 'postprocessing';

export class PostProcessor {
  private composer: EffectComposer;
  //private bloomPass: EffectPass;
  private brightnessContrastPass: EffectPass;
  private fxaaPass: EffectPass;

  // Для управления пиксель-рейшо
  //private pixelRatio: number = Math.min(window.devicePixelRatio, 2);

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number
  ) {
    this.composer = new EffectComposer(renderer);

    // Установка размера + пиксель-рейшо
    this.setSize(width, height); // вызываем кастомный метод

    // === Render Pass ===
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // === Bloom Effect ===
    /*const bloomEffect = new BloomEffect({
      blendFunction: 4, // BlendFunction.SCREEN — лучше, чем 1 (ADD)
      kernelSize: 2,   // KernelSize.LARGE — хорошее размытие
      luminanceThreshold: 0.1,   // ⚠️ Повышен! Только ЯРКИЕ объекты будут светиться
      luminanceSmoothing: 0.2,   // Плавный переход
      intensity: 0.1,            // Не слишком ярко
    });*/

    const brightnessContrastEffect = new BrightnessContrastEffect({
      blendFunction: 4,
      brightness: 0.1,
      contrast: 0.1,
    });

    //this.bloomPass = new EffectPass(camera, bloomEffect);
    this.brightnessContrastPass = new EffectPass(camera, brightnessContrastEffect);
    //this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.brightnessContrastPass);

    // === FXAA ===
    this.fxaaPass = new EffectPass(camera, new FXAAEffect());
    this.composer.addPass(this.fxaaPass);
  }

  render(): void {
    this.composer.render();
  }

  /**
   * Обновить размер рендерера
   */
  setSize(width: number, height: number): void {
    //const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.composer.setSize(width, height); // ← без третьего аргумента
    //this.composer.setPixelRatio(pixelRatio);
  }

  /**
   * Очистка
   */
  dispose(): void {
    this.composer.removeAllPasses();

    // В v6+ нет доступа к renderTarget1/2
    // Но можно вручную освободить внутренние цели, если нужно
    // (обычно GC сам справляется)
  }
}
