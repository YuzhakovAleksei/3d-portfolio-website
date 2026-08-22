import { eventBus } from '../core/eventBus.js';

export class Modal {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.closeBtn = null;
        this.isOpen = false;
        
        // Галерея
        this.items = [];          // Все объекты портфолио
        this.currentIndex = 0;    // Текущий индекс
        this.isLoading = false;   // Флаг загрузки
        this.preloadedImages = {}; // Кеш загруженных изображений
        
        // Навигация
        this.prevBtn = null;
        this.nextBtn = null;
        this.counter = null;
        
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    init() {
        if (!this.container) {
            console.warn('Modal: контейнер не найден');
            return;
        }

        // 1. Создаём ЕДИНЫЙ КОНТЕЙНЕР для всего содержимого модалки
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'modal-content'; // Этот класс мы будем стилизовать

        // Создаём Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'modalCanvas';
        this.canvas.style.maxWidth = '90%';
        this.canvas.style.maxHeight = '85%';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = 'auto';
        contentWrapper.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');

        // Отключаем контекстное меню на Canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // Кнопка закрытия
        this.closeBtn = this.container.querySelector('.modal-close');
        if (!this.closeBtn) {
            this.closeBtn = document.createElement('span');
            this.closeBtn.className = 'modal-close';
            this.closeBtn.innerHTML = '&times;';
            this.container.prepend(this.closeBtn);
        }
        
        // Кнопки навигации (создаём, если их нет)
        this.createNavigation();

        // Счётчик
        this.counter = document.createElement('div');
        this.counter.className = 'modal-counter';
        this.container.appendChild(this.counter);

        // 4. Очищаем модалку и добавляем в неё готовый контейнер
        this.container.innerHTML = ''; // Очищаем от старых элементов
        this.container.appendChild(contentWrapper);

        // Подписка на события
        eventBus.on('modal:open', this.open);
        eventBus.on('modal:close', this.close);

        // DOM-события
        this.closeBtn.addEventListener('click', this.close);
        this.container.addEventListener('click', this.handleOutsideClick);
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Кнопки навигации
        if (this.prevBtn) this.prevBtn.addEventListener('click', this.prev);
        if (this.nextBtn) this.nextBtn.addEventListener('click', this.next);

        this.container.style.display = 'none';
        this.contentContainer = contentWrapper;
        console.log('✅ Modal with Gallery initialized');
    }
    
    createNavigation() {
        // Контейнер для кнопок
        const navContainer = document.createElement('div');
        navContainer.className = 'modal-nav';
        navContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            pointer-events: none;
            z-index: 10;
        `;
        
        // Предыдущая
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'modal-nav-btn modal-prev';
        this.prevBtn.innerHTML = '‹';
        this.prevBtn.style.cssText = `
            pointer-events: auto;
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 30px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        this.prevBtn.onmouseover = () => this.prevBtn.style.background = 'rgba(0,0,0,0.8)';
        this.prevBtn.onmouseout = () => this.prevBtn.style.background = 'rgba(0,0,0,0.5)';
        
        // Следующая
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'modal-nav-btn modal-next';
        this.nextBtn.innerHTML = '›';
        this.nextBtn.style.cssText = `
            pointer-events: auto;
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            font-size: 30px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        this.nextBtn.onmouseover = () => this.nextBtn.style.background = 'rgba(0,0,0,0.8)';
        this.nextBtn.onmouseout = () => this.nextBtn.style.background = 'rgba(0,0,0,0.5)';
        
        navContainer.appendChild(this.prevBtn);
        navContainer.appendChild(this.nextBtn);
        this.container.appendChild(navContainer);
        this.container.style.position = 'relative';
    }

    open(data) {
        if (!data || !data.full) {
            console.warn('Modal: нет данных');
            return;
        }

        // Если пришли все данные портфолио — сохраняем
        if (data.items && Array.isArray(data.items)) {
            this.items = data.items;
            this.currentIndex = data.index || 0;
        } else {
            // Если пришёл только один объект — создаём массив из него
            this.items = [data];
            this.currentIndex = 0;
        }

        this.container.style.display = 'flex';
        this.container.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Показываем изображение
        this.showCurrentImage();
        this.updateCounter();
        this.updateNavButtons();
    }
    
    showCurrentImage() {
        if (this.isLoading) return;
        
        const item = this.items[this.currentIndex];
        if (!item || !item.full) {
            console.warn('Modal: нет изображения по индексу', this.currentIndex);
            return;
        }
        
        // Проверяем кеш
        if (this.preloadedImages[item.full]) {
            this.renderImageFromCache(item.full);
            return;
        }
        
        this.isLoading = true;
        
        // Показываем индикатор загрузки
        this.showLoader();
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            // Кешируем
            this.preloadedImages[item.full] = img;
            this.isLoading = false;
            this.renderImage(img);
            
            // Предзагружаем соседние (Lazy Preloading)
            this.preloadAdjacent();
        };
        
        img.onerror = (err) => {
            console.error('Ошибка загрузки изображения:', err);
            this.isLoading = false;
            this.showError();
        };
        
        img.src = item.full;
    }
    
    renderImageFromCache(imageSrc) {
        const img = this.preloadedImages[imageSrc];
        if (img) {
            this.renderImage(img);
        }
    }
    
    renderImage(img) {
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.85;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(img, 0, 0, width, height);
        
        // Скрываем индикатор загрузки
        this.hideLoader();
    }
    
    preloadAdjacent() {
        // Предзагружаем следующее и предыдущее изображения
        const indices = [this.currentIndex - 1, this.currentIndex + 1];
        
        indices.forEach(index => {
            if (index >= 0 && index < this.items.length) {
                const item = this.items[index];
                if (item && item.full && !this.preloadedImages[item.full]) {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        this.preloadedImages[item.full] = img;
                        console.log(`✅ Предзагружено: ${item.title}`);
                    };
                    img.src = item.full;
                }
            }
        });
    }
    
    showLoader() {
        // Показываем индикатор загрузки на Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Загрузка...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    hideLoader() {
        // Ничего не делаем, canvas уже перерисован
    }
    
    showError() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#666';
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Не удалось загрузить изображение', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    updateCounter() {
        if (this.counter) {
            this.counter.textContent = `${this.currentIndex + 1} / ${this.items.length}`;
            this.counter.style.cssText = `
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                background: rgba(0,0,0,0.5);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 10;
            `;
        }
    }
    
    updateNavButtons() {
        if (this.prevBtn) {
            this.prevBtn.style.display = this.currentIndex > 0 ? 'block' : 'none';
        }
        if (this.nextBtn) {
            this.nextBtn.style.display = this.currentIndex < this.items.length - 1 ? 'block' : 'none';
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showCurrentImage();
            this.updateCounter();
            this.updateNavButtons();
        }
    }
    
    next() {
        if (this.currentIndex < this.items.length - 1) {
            this.currentIndex++;
            this.showCurrentImage();
            this.updateCounter();
            this.updateNavButtons();
        }
    }

    close() {
        this.container.classList.remove('active');
        this.container.style.display = 'none';
        this.isOpen = false;
        document.body.style.overflow = '';
        
        // Опционально: очищаем кеш для экономии памяти
        // this.preloadedImages = {};
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    handleOutsideClick(event) {
        if (event.target === this.container) {
            this.close();
        }
    }

    handleKeyDown(event) {
        if (!this.isOpen) return;
        
        switch(event.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.prev();
                break;
            case 'ArrowRight':
                this.next();
                break;
        }
    }

    dispose() {
        eventBus.off('modal:open', this.open);
        eventBus.off('modal:close', this.close);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        if (this.closeBtn) {
            this.closeBtn.removeEventListener('click', this.close);
        }
        if (this.prevBtn) {
            this.prevBtn.removeEventListener('click', this.prev);
        }
        if (this.nextBtn) {
            this.nextBtn.removeEventListener('click', this.next);
        }
        
        console.log('🧹 Modal disposed');
    }
}