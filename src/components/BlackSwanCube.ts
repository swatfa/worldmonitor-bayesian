/**
 * 3D Correlation Cube Visualization
 * 
 * Visualizes multi-dimensional correlations in a 3D space
 * where each axis represents a different risk dimension.
 * High-correlation regions are highlighted as "hot zones".
 */

import * as THREE from 'three';

export interface CubeVisualizationData {
  correlationMatrix: number[][]; // NxN matrix
  labels: string[];
  hotspots: Array<{
    x: number;
    y: number;
    z: number;
    intensity: number;
    label: string;
  }>;
}

export class BlackSwanCube {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Group;
  private animationId: number | null = null;
  private mouseX = 0;
  private mouseY = 0;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Ensure container has dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      container.style.width = '100%';
      container.style.height = '240px';
    }
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    this.scene.fog = new THREE.FogExp2(0x050508, 0.15);
    
    // Camera
    const width = container.clientWidth || 450;
    const height = container.clientHeight || 240;
    this.camera = new THREE.PerspectiveCamera(
      50, 
      width / height,
      0.1,
      1000
    );
    this.camera.position.z = 6;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear container and add canvas
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);
    
    // Main cube group
    this.cube = new THREE.Group();
    this.scene.add(this.cube);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    this.scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xff6b35, 2, 100);
    pointLight1.position.set(5, 5, 5);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight2.position.set(-5, -5, 5);
    this.scene.add(pointLight2);

    this.addStarfield();
    
    // Mouse interaction
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
    
    this.animate();
  }

  private addStarfield(): void {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 800; i++) {
      vertices.push(THREE.MathUtils.randFloatSpread(20));
      vertices.push(THREE.MathUtils.randFloatSpread(20));
      vertices.push(THREE.MathUtils.randFloatSpread(20));
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ 
      color: 0xff6b35, 
      size: 0.04, 
      transparent: true, 
      opacity: 0.3 
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
  }
  
  private onMouseMove(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  public updateData(data: CubeVisualizationData): void {
    // Clear existing cube
    while (this.cube.children.length > 0) {
      this.cube.remove(this.cube.children[0]);
    }
    
    // Double-shell wireframe
    const outerSize = 3.2;
    const outerWireframe = new THREE.Mesh(
      new THREE.BoxGeometry(outerSize, outerSize, outerSize),
      new THREE.MeshBasicMaterial({ color: 0xff6b35, wireframe: true, transparent: true, opacity: 0.1 })
    );
    this.cube.add(outerWireframe);

    const cubeSize = 3;
    const wireframeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireframeCube = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    this.cube.add(wireframeCube);
    
    // Add axis labels
    if (data.labels && data.labels.length > 0) {
      this.addAxisLabels(data.labels.slice(0, 3), cubeSize);
    }
    
    // Plot correlation hotspots as spheres
    if (data.hotspots && data.hotspots.length > 0) {
      for (const hotspot of data.hotspots) {
        this.addHotspot(
          hotspot.x * cubeSize - cubeSize / 2,
          hotspot.y * cubeSize - cubeSize / 2,
          hotspot.z * cubeSize - cubeSize / 2,
          hotspot.intensity,
          hotspot.label
        );
      }
    }
    
    // Add correlation planes (heatmap-style)
    if (data.correlationMatrix && data.correlationMatrix.length > 0) {
      this.addCorrelationPlanes(data.correlationMatrix, cubeSize);
    }
    
    // Add connecting lines between high-correlation points
    if (data.hotspots && data.hotspots.length > 0) {
      this.addCorrelationLines(data.hotspots, cubeSize);
    }
  }
  
  private addAxisLabels(labels: string[], cubeSize: number): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    const offset = cubeSize / 2 + 0.5;
    const labelPositions = [
      { text: labels[0] || 'X-Axis', pos: new THREE.Vector3(offset, 0, 0), color: 0xff0000 },
      { text: labels[1] || 'Y-Axis', pos: new THREE.Vector3(0, offset, 0), color: 0x00ff00 },
      { text: labels[2] || 'Z-Axis', pos: new THREE.Vector3(0, 0, offset), color: 0x0000ff },
    ];
    
    for (const label of labelPositions) {
      context.fillStyle = '#ffffff';
      context.font = 'Bold 32px Arial';
      context.textAlign = 'center';
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillText(label.text, canvas.width / 2, canvas.height / 2 + 10);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(label.pos);
      sprite.scale.set(1, 0.25, 1);
      this.cube.add(sprite);
    }
  }
  
  private addHotspot(x: number, y: number, z: number, intensity: number, label: string): void {
    // Size and color based on intensity
    const radius = 0.1 + intensity * 0.4;
    const color = new THREE.Color();
    
    // High intensity = Red/Orange, Low = Teal
    if (intensity > 0.7) {
      color.setHex(0xff0000);
    } else if (intensity > 0.4) {
      color.setHex(0xffaa00);
    } else {
      color.setHex(0x00ffff);
    }
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity * 0.8,
      transparent: true,
      opacity: 0.6 + intensity * 0.4,
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    (sphere as any).userData = { label, intensity };
    this.cube.add(sphere);
    
    // Pulse effect
    const glowSize = radius * (1.2 + intensity * 0.8);
    const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(x, y, z);
    this.cube.add(glow);
    (glow as any).userData = { isPulsing: true, phase: Math.random() * Math.PI * 2, baseScale: 1 };
  }
  
  private addCorrelationPlanes(matrix: number[][], cubeSize: number): void {
    if (matrix.length < 3) return;
    
    // XY plane (Economic vs Seismic)
    this.addHeatmapPlane(matrix[0][1], cubeSize, 'xy', -cubeSize / 2);
    
    // XZ plane (Economic vs Social)
    this.addHeatmapPlane(matrix[0][2], cubeSize, 'xz', -cubeSize / 2);
    
    // YZ plane (Seismic vs Social)
    this.addHeatmapPlane(matrix[1][2], cubeSize, 'yz', -cubeSize / 2);
  }
  
  private addHeatmapPlane(correlation: number, size: number, plane: 'xy' | 'xz' | 'yz', offset: number): void {
    const geometry = new THREE.PlaneGeometry(size * 0.8, size * 0.8);
    
    // Color based on correlation strength
    const color = new THREE.Color();
    const absCorr = Math.abs(correlation);
    color.setHSL(correlation > 0 ? 0 : 0.6, absCorr, 0.3 + absCorr * 0.2);
    
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: absCorr * 0.3,
      side: THREE.DoubleSide,
    });
    
    const planeMesh = new THREE.Mesh(geometry, material);
    
    switch (plane) {
      case 'xy':
        planeMesh.position.z = offset;
        break;
      case 'xz':
        planeMesh.rotation.x = Math.PI / 2;
        planeMesh.position.y = offset;
        break;
      case 'yz':
        planeMesh.rotation.y = Math.PI / 2;
        planeMesh.position.x = offset;
        break;
    }
    
    this.cube.add(planeMesh);
  }
  
  private addCorrelationLines(hotspots: any[], cubeSize: number): void {
    for (let i = 0; i < hotspots.length; i++) {
      for (let j = i + 1; j < hotspots.length; j++) {
        const h1 = hotspots[i];
        const h2 = hotspots[j];
        
        // Draw line if both have high intensity
        if (h1.intensity > 0.5 && h2.intensity > 0.5) {
          const points = [
            new THREE.Vector3(
              h1.x * cubeSize - cubeSize / 2,
              h1.y * cubeSize - cubeSize / 2,
              h1.z * cubeSize - cubeSize / 2
            ),
            new THREE.Vector3(
              h2.x * cubeSize - cubeSize / 2,
              h2.y * cubeSize - cubeSize / 2,
              h2.z * cubeSize - cubeSize / 2
            ),
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: Math.min(h1.intensity, h2.intensity) * 0.5,
          });
          
          const line = new THREE.Line(geometry, material);
          this.cube.add(line);
        }
      }
    }
  }
  
  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    // Rotate cube based on mouse position
    const targetRotationY = this.mouseX * Math.PI * 0.5;
    const targetRotationX = this.mouseY * Math.PI * 0.5;
    
    this.cube.rotation.y += (targetRotationY - this.cube.rotation.y) * 0.05;
    this.cube.rotation.x += (targetRotationX - this.cube.rotation.x) * 0.05;
    
    // Auto-rotation when mouse is idle
    this.cube.rotation.y += 0.001;
    
    // Pulse glowing spheres
    const time = Date.now() * 0.001;
    this.cube.children.forEach((child) => {
      if ((child as any).userData?.isPulsing) {
        const phase = (child as any).userData.phase;
        const scale = 1 + Math.sin(time * 3 + phase) * 0.2;
        child.scale.set(scale, scale, scale);
        
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = 0.05 + Math.sin(time * 3 + phase) * 0.05;
      }
    });
    
    this.renderer.render(this.scene, this.camera);
  }
  
  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('resize', this.onResize.bind(this));
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
