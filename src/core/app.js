import { CONFIG } from './config.js';
import { eventBus } from './eventBus.js';

class App {
    constructor() {
        this.modules = [];
        this.isInitialized = false;
    }
    
    // Регистрация модуля (компонент, ThreeManager, и т.д.)
    register(module) {
        this.modules.push(module);
        if (module.setApp) module.setApp(this);
        return this;
    }
    
    // Инициализация всех модулей
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing App...');
        
        // Инициализируем модули последовательно
        for (const module of this.modules) {
            if (module.init) {
                try {
                    await module.init();
                    console.log(`✓ ${module.constructor.name} initialized`);
                } catch (error) {
                    console.error(`✗ Failed to init ${module.constructor.name}:`, error);
                }
            }
        }
        
        this.isInitialized = true;
        eventBus.emit('app:ready');
        console.log('✅ App ready');
    }
    
    getConfig() {
        return CONFIG;
    }
}

// Создаем и экспортируем единственный экземпляр
export const app = new App();