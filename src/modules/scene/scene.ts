import * as THREE from 'three';
import { BaseModule } from '@modules/base-module';
import { getConfig } from '@core/config';
import { EventManager } from '@core/events';
import type { MousePosition } from '@core/types';
import { PostProcessor } from '@modules/postprocessing/post-processor';

/**
 * Модуль сцены
 * Управляет 3D сценой, объектами, частицами
 */
export class SceneModule extends BaseModule {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  // Постобработка
  private postProcessor!: PostProcessor;
  
  // Объекты сцены
  private particleSystem!: THREE.Points;
  private linesGeometry!: THREE.BufferGeometry;
  private linesMesh!: THREE.LineSegments;
  private centralObject!: THREE.Mesh;
  
  // Данные частиц
  private positions!: Float32Array;
  private originalPositions!: Float32Array;
  private velocities!: Float32Array;
  private particleCount: number = 0;
  
  // Состояние
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private currentRotation: THREE.Vector2 = new THREE.Vector2();
  private targetRotation: THREE.Vector2 = new THREE.Vector2();
  
  // Обработчики событий
  private _onMouseMove: ((data: MousePosition) => void) | null = null;
  private _onScroll: ((data: { progress: number }) => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    super('Scene');
    this.camera = camera;
    this.renderer = renderer;
  }

  init(): void {
    if (this.initialized) return;

    // Проверка на fallback режим
    const canvas = document.querySelector('#webgl-canvas') as HTMLCanvasElement;
    if (canvas && canvas.style.display === 'none') {
      this.debug('Skipping initialization - fallback mode');
      this.initialized = true;
      return;
    }

    this.setupScene();
    this.setupParticles();
    this.setupLines();
    this.setupCentralObject();
    this.setupLights();
    this.setupPostProcessing(); // ← Новый шаг
    this.setupEventListeners();

    this.initialized = true;
    EventManager.emit('webgl:initialized', { renderer: this.renderer, scene: this.scene });
    this.debug('Initialized');
  }

  private setupScene(): void {
    const config = getConfig('three');
    
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(config.bgColor, config.fogDensity);
  }

  private setupParticles(): void {
    const config = getConfig('three');
    this.particleCount = config.particleCount;
    
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    // Инициализация позиций частиц (сферическое распределение)
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      this.positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = radius * Math.cos(phi);

      this.originalPositions[i3] = this.positions[i3];
      this.originalPositions[i3 + 1] = this.positions[i3 + 1];
      this.originalPositions[i3 + 2] = this.positions[i3 + 2];

      this.velocities[i3] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: config.particleColor,
      //color: 0xffffff,
      size: config.particleSize,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  private setupLines(): void {
    const maxLines = this.particleCount * this.particleCount;
    const linePositions = new Float32Array(maxLines * 3);
    const lineColors = new Float32Array(maxLines * 3);

    this.linesGeometry = new THREE.BufferGeometry();
    this.linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.linesGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      //opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    this.linesMesh = new THREE.LineSegments(this.linesGeometry, material);
    this.scene.add(this.linesMesh);
  }

  private setupCentralObject(): void {
    //const config = getConfig('three');
    
    const geometry = new THREE.IcosahedronGeometry(8, 1);
    const material = new THREE.MeshPhongMaterial({
      //color: config.particleColor,
      color: 0x9d4edd,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      //emissive: config.particleColor,
      emissive: 0x9d4edd,
      //emissiveIntensity: 0.5,
      emissiveIntensity: 0.6,
    });

    this.centralObject = new THREE.Mesh(geometry, material);
    this.scene.add(this.centralObject);
  }

  private setupLights(): void {
    const config = getConfig('three');
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(config.particleColor, 1, 100);
    pointLight1.position.set(20, 20, 20);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00b4d8, 1, 100);
    pointLight2.position.set(-20, -20, -20);
    this.scene.add(pointLight2);
  }

  /**
   * Инициализация постобработки
   */
  private setupPostProcessing(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.postProcessor = new PostProcessor(
      this.renderer,
      this.scene,
      this.camera,
      width,
      height
    );
  }

  private setupEventListeners(): void {
    this._onMouseMove = (data: MousePosition) => {
      this.mouse.x = data.normalizedX;
      this.mouse.y = data.normalizedY;
      this.targetRotation.x = data.normalizedY * 0.5;
      this.targetRotation.y = data.normalizedX * 0.5;
    };

    this._onScroll = (data: { progress: number }) => {
      this.updateCameraOnScroll(data.progress);
    };

    EventManager.on('mouse:move', this._onMouseMove);
    EventManager.on('scroll', this._onScroll);
  }

  /**
   * Обновить линии между частицами
   */
  private updateLines(): void {
    const config = getConfig('three');
    const linePositions = this.linesGeometry.attributes.position.array as Float32Array;
    const lineColors = this.linesGeometry.attributes.color.array as Float32Array;
    
    let lineIndex = 0;
    const color = new THREE.Color(config.particleColor);

    for (let i = 0; i < this.particleCount; i++) {
      for (let j = i + 1; j < this.particleCount; j++) {
        const i3 = i * 3;
        const j3 = j * 3;

        const dx = this.positions[i3] - this.positions[j3];
        const dy = this.positions[i3 + 1] - this.positions[j3 + 1];
        const dz = this.positions[i3 + 2] - this.positions[j3 + 2];

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < config.connectionDistance) {
          const lineIndex6 = lineIndex * 6;
          
          linePositions[lineIndex6] = this.positions[i3];
          linePositions[lineIndex6 + 1] = this.positions[i3 + 1];
          linePositions[lineIndex6 + 2] = this.positions[i3 + 2];
          linePositions[lineIndex6 + 3] = this.positions[j3];
          linePositions[lineIndex6 + 4] = this.positions[j3 + 1];
          linePositions[lineIndex6 + 5] = this.positions[j3 + 2];

          const lineColorIndex = lineIndex6;
          lineColors[lineColorIndex] = color.r;
          lineColors[lineColorIndex + 1] = color.g;
          lineColors[lineColorIndex + 2] = color.b;
          lineColors[lineColorIndex + 3] = color.r;
          lineColors[lineColorIndex + 4] = color.g;
          lineColors[lineColorIndex + 5] = color.b;

          lineIndex++;
        }
      }
    }

    // Обновляем количество вершин через setDrawRange
    this.linesGeometry.setDrawRange(0, lineIndex * 2);
    this.linesGeometry.attributes.position.needsUpdate = true;
    this.linesGeometry.attributes.color.needsUpdate = true;
  }

  /**
   * Обновить взаимодействие частиц с мышью
   */
  private updateParticleInteraction(): void {
    const config = getConfig('three');
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(this.mouse, this.camera);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      const dx = this.positions[i3] - this.mouse.x * 50;
      const dy = this.positions[i3 + 1] - this.mouse.y * 50;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Отталкивание от мыши
      if (distance < config.mouseInteractionRadius) {
        const force = (config.mouseInteractionRadius - distance) / config.mouseInteractionRadius;
        this.positions[i3] += (dx / distance) * force * 2;
        this.positions[i3 + 1] += (dy / distance) * force * 2;
      }

      // Возврат к оригинальной позиции
      this.positions[i3] += (this.originalPositions[i3] - this.positions[i3]) * 0.02;
      this.positions[i3 + 1] += (this.originalPositions[i3 + 1] - this.positions[i3 + 1]) * 0.02;
      this.positions[i3 + 2] += (this.originalPositions[i3 + 2] - this.positions[i3 + 2]) * 0.02;

      // Небольшое случайное движение
      const time = Date.now() * 0.001;
      this.positions[i3] += Math.sin(time + i) * 0.01;
      this.positions[i3 + 1] += Math.cos(time + i) * 0.01;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Обновить камеру при скролле
   */
  private updateCameraOnScroll(scrollProgress: number): void {
    const targetZ = 50 - scrollProgress * 30;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
    this.camera.rotation.y = scrollProgress * 0.5;
  }

  /**
   * Главный цикл обновления сцены
   */
  update(): void {
    const config = getConfig('three');
    const time = Date.now() * 0.001;

    // Плавное вращение
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.05;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.05;

    // Вращение системы частиц
    this.particleSystem.rotation.x += config.rotationSpeed;
    this.particleSystem.rotation.y += config.rotationSpeed * 0.5;
    this.particleSystem.rotation.x += this.currentRotation.x * 0.02;
    this.particleSystem.rotation.y += this.currentRotation.y * 0.02;

    // Вращение центрального объекта
    this.centralObject.rotation.x += 0.005;
    this.centralObject.rotation.y += 0.005;

    // Пульсация центрального объекта
    const scale = 1 + Math.sin(time * 2) * 0.1;
    this.centralObject.scale.set(scale, scale, scale);

    // Обновление частиц и линий
    this.updateParticleInteraction();
    this.updateLines();
  }

  /**
   * Рендер сцены
   */
  render(): void {
    this.update();
    //this.renderer.render(this.scene, this.camera);
    this.postProcessor.render(); // ✅ Рендер через composer
  }

  /**
   * Обновить размеры при ресайзе
   */
  onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.postProcessor.setSize(width, height); // ✅ Передаём в post-processor
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  destroy(): void {
    // Отписка от событий
    if (this._onMouseMove) {
      EventManager.off('mouse:move', this._onMouseMove as (...args: unknown[]) => void);
    }
    if (this._onScroll) {
      EventManager.off('scroll', this._onScroll as (...args: unknown[]) => void);
    }

    this.postProcessor.dispose(); // ✅ Очистка composer

    // Очистка сцены
    this.scene.clear();
    
    // Освобождение ресурсов
    this.particleSystem.geometry.dispose();
    (this.particleSystem.material as THREE.Material).dispose();
    this.linesGeometry.dispose();
    (this.linesMesh.material as THREE.Material).dispose();
    this.centralObject.geometry.dispose();
    (this.centralObject.material as THREE.Material).dispose();
    
    super.destroy();
  }
}
