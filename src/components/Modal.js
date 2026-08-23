import { eventBus } from '../core/eventBus.js';

export class Modal {
    constructor(containerId) {
        this.container = document.getElementById('imageModal');
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
        console.log('1. createNavigation() начал работу');

        // 1. Находим или создаём контейнер modal-content
        let content = this.container.querySelector('.modal-content');
        if (!content) {
            console.warn('2. .modal-content не найден, создаём новый');
            content = document.createElement('div');
            content.className = 'modal-content';
            this.container.appendChild(content);
        } else {
            console.log('2. .modal-content найден');
        }

        // 2. Удаляем старую навигацию, если она есть
        const oldNav = content.querySelector('.modal-nav');
        if (oldNav) {
            console.log('3. Удаляем старую навигацию');
            oldNav.remove();
        }

        // 3. Создаём контейнер для кнопок
        const navContainer = document.createElement('div');
        navContainer.className = 'modal-nav';
        console.log('4. Контейнер навигации создан');
        
        // Создаём кнопку "Назад"
        const prevBtn = document.createElement('button');
        prevBtn.className = 'modal-nav-btn modal-prev';
        prevBtn.innerHTML = '‹';
        console.log('5. Кнопка "Назад" создана');

        // Создаём кнопку "Вперёд"
        const nextBtn = document.createElement('button');
        nextBtn.className = 'modal-nav-btn modal-next';
        nextBtn.innerHTML = '›';
        console.log('5. Кнопка "Вперёд" создана');

        // 6. Добавляем кнопки в контейнер
        navContainer.appendChild(prevBtn);
        navContainer.appendChild(nextBtn);
        console.log('7. Кнопки добавлены в контейнер навигации');

        // 7. Добавляем контейнер навигации в modal-content
        content.appendChild(navContainer);
        console.log('8. Контейнер навигации добавлен в .modal-content');

        // 8. Проверяем, что кнопки в DOM
        const checkNav = content.querySelector('.modal-nav');
        if (checkNav) {
            console.log('9. Успех! Навигация добавлена, кнопок внутри:', checkNav.children.length);
        } else {
            console.error('10. ОШИБКА: Навигация не найдена в DOM!');
        }

        // Добавляем кнопки в body (вне модалки, для надёжности)
        document.body.appendChild(prevBtn);
        document.body.appendChild(nextBtn);

        // 9. Сохраняем ссылки для методов prev/next
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
        console.log('11. createNavigation() завершил работу');
    }

    open(data) {
        console.log('1. Метод open() вызван с данными:', data);
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
        console.log('2. Модалке присвоен display: flex');
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
        console.log('3. Начинаем загрузку изображения:', img);
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
        console.log('4. Изображение загружено и отрисовано');
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
        if (this.prevBtn) this.prevBtn.remove();
        if (this.nextBtn) this.nextBtn.remove();
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