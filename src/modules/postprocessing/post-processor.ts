import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BrightnessContrastEffect,
  FXAAEffect,
} from 'postprocessing';

export class PostProcessor {
  private composer: EffectComposer;
  private brightnessContrastPass: EffectPass;
  private fxaaPass: EffectPass;

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

    const brightnessContrastEffect = new BrightnessContrastEffect({
      blendFunction: 4,
      brightness: 0.1,
      contrast: 0.1,
    });

    this.brightnessContrastPass = new EffectPass(
      camera,
      brightnessContrastEffect
    );

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
    this.composer.setSize(width, height);
  }

  /**
   * Очистка
   */
  dispose(): void {
    this.composer.removeAllPasses();
  }
}
