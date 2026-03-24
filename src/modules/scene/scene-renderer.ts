// src/modules/scene/scene-renderer.ts
import * as THREE from 'three';
import { getConfig } from '@core/config';

interface SceneRendererOptions {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export class SceneRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Объекты сцены
  public particleSystem!: THREE.Points;
  public linesMesh!: THREE.LineSegments;
  public centralObject!: THREE.Mesh;

  // Данные частиц
  private positions!: Float32Array;
  private originalPositions!: Float32Array;
  private velocities!: Float32Array;
  private particleCount: number = 0;

  constructor({ scene, camera }: SceneRendererOptions) {
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * Создать все объекты сцены
   */
  init(): void {
    this.setupParticles();
    this.setupLines();
    this.setupCentralObject();
    this.setupLights();
  }

  private setupParticles(): void {
    const config = getConfig('three');
    this.particleCount = config.particleCount;

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    this.linesMesh = new THREE.LineSegments(geometry, material);
    this.scene.add(this.linesMesh);
  }

  private setupCentralObject(): void {
    const config = getConfig('three');

    const geometry = new THREE.IcosahedronGeometry(8, 1);
    const material = new THREE.MeshPhongMaterial({
      color: config.particleColor,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
      emissive: config.particleColor,
      emissiveIntensity: 0.5,
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
   * Обновить линии между частицами
   */
  updateLines(): void {
    const config = getConfig('three');
    const linePositions = this.linesMesh.geometry.attributes.position.array as Float32Array;
    const lineColors = this.linesMesh.geometry.attributes.color.array as Float32Array;

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

    this.linesMesh.geometry.setDrawRange(0, lineIndex * 2);
    this.linesMesh.geometry.attributes.position.needsUpdate = true;
    this.linesMesh.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Обновить взаимодействие частиц с мышью
   */
  updateParticleInteraction(mouse: THREE.Vector2): void {
    const config = getConfig('three');

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      const dx = this.positions[i3] - mouse.x * 50;
      const dy = this.positions[i3 + 1] - mouse.y * 50;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < config.mouseInteractionRadius) {
        const force = (config.mouseInteractionRadius - distance) / config.mouseInteractionRadius;
        this.positions[i3] += (dx / distance) * force * 2;
        this.positions[i3 + 1] += (dy / distance) * force * 2;
      }

      this.positions[i3] += (this.originalPositions[i3] - this.positions[i3]) * 0.02;
      this.positions[i3 + 1] += (this.originalPositions[i3 + 1] - this.positions[i3 + 1]) * 0.02;
      this.positions[i3 + 2] += (this.originalPositions[i3 + 2] - this.positions[i3 + 2]) * 0.02;

      const time = Date.now() * 0.001;
      this.positions[i3] += Math.sin(time + i) * 0.01;
      this.positions[i3 + 1] += Math.cos(time + i) * 0.01;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Обновить анимацию объектов
   */
  updateObjects(currentRotation: THREE.Vector2, scrollProgress: number): void {
    const config = getConfig('three');
    const time = Date.now() * 0.001;

    // Вращение системы частиц
    this.particleSystem.rotation.x += config.rotationSpeed;
    this.particleSystem.rotation.y += config.rotationSpeed * 0.5;
    //this.particleSystem.rotation.x += currentRotation.x * 0.02;
    //this.particleSystem.rotation.y += currentRotation.y * 0.02;
    this.particleSystem.rotation.x += currentRotation.x * 0.03;
    this.particleSystem.rotation.y += currentRotation.y * 0.03;

    // Вращение и пульсация центрального объекта
    this.centralObject.rotation.x += 0.005;
    this.centralObject.rotation.y += 0.005;

    const scale = 1 + Math.sin(time * 2) * 0.1;
    this.centralObject.scale.set(scale, scale, scale);

    // Обновляем позицию камеры через scrollProgress
    this.camera.position.z = 50 - scrollProgress * 30;
    this.camera.rotation.y = scrollProgress * 0.5;
  }

  /**
   * Очистка ресурсов
   */
  dispose(): void {
    this.scene.remove(this.particleSystem);
    this.scene.remove(this.linesMesh);
    this.scene.remove(this.centralObject);

    this.particleSystem.geometry.dispose();
    (this.particleSystem.material as THREE.Material).dispose();

    this.linesMesh.geometry.dispose();
    (this.linesMesh.material as THREE.Material).dispose();

    this.centralObject.geometry.dispose();
    (this.centralObject.material as THREE.Material).dispose();
  }
}
