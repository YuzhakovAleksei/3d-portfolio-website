import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { eventBus } from '../core/eventBus.js';

export class ThreeManager {
    constructor(containerId, config) {
        this.containerId = containerId;
        this.config = config;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loader = null;
        this.currentModel = null;
        this.animationId = null;
    }
    
    async init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn(`Container #${this.containerId} not found`);
            return;
        }
        
        // Сцена
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor || 0x111122);
        
        // Камера
        const pos = this.config.cameraPosition || { x: 5, y: 5, z: 5 };
        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(pos.x, pos.y, pos.z);
        this.camera.lookAt(0, 0, 0);
        
        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);
        
        // Контролы
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = this.config.autoRotateSpeed || 1.5;
        
        // Загрузчик
        this.loader = new GLTFLoader();
        
        // Освещение
        this.setupLights();
        
        // Вспомогательные элементы
        this.setupHelpers();
        
        // Запуск анимации
        this.startAnimation();
        
        // Обработка resize
        window.addEventListener('resize', () => this.onResize());
        
        eventBus.emit('three:ready');
        console.log('ThreeManager initialized');
    }
    
    setupLights() {
        // Ambient
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Main directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(2, 5, 3);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        
        // Fill light
        const fillLight = new THREE.PointLight(0x4466cc, 0.3);
        fillLight.position.set(0, -2, 0);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.PointLight(0xffaa66, 0.5);
        rimLight.position.set(-2, 1, -3);
        this.scene.add(rimLight);
    }
    
    setupHelpers() {
        // Грид (помогает с ориентацией)
        const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        gridHelper.position.y = -1.5;
        this.scene.add(gridHelper);
    }
    
    async loadModel(path, options = {}) {
        if (!this.loader) throw new Error('Loader not initialized');
        
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Опциональные трансформации
                    if (options.scale) model.scale.set(options.scale, options.scale, options.scale);
                    if (options.position) model.position.set(options.position.x, options.position.y, options.position.z);
                    
                    resolve(model);
                },
                (progress) => {
                    if (options.onProgress) options.onProgress(progress);
                },
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }
    
    setModel(model, autoRotate = true) {
        // Удаляем старую модель, если есть
        if (this.currentModel) {
            this.scene.remove(this.currentModel);
        }
        
        this.currentModel = model;
        this.scene.add(model);
        
        if (this.controls) {
            this.controls.autoRotate = autoRotate;
            this.controls.target.set(0, 0, 0);
        }
        
        eventBus.emit('three:modelChanged', { model });
    }
    
    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            if (this.controls) {
                this.controls.update();
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        animate();
    }
    
    onResize() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', this.onResize);
    }
}