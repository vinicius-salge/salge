/**
 * SALGE Portfolio - Interações
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURAÇÕES
    // ========================================
    const CONFIG = {
        animationThreshold: 0.15,
        scrollOffset: 80
    };

    // ========================================
    // UTILITÁRIOS
    // ========================================
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========================================
    // ANIMAÇÕES DE ENTRADA (SCROLL)
    // ========================================
    
    const ScrollAnimations = {
        elements: [],
        
        init() {
            this.elements = document.querySelectorAll('.fade-in, .slide-up, .project-card, .masonry-item');
            this.observeElements();
        },

        observeElements() {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('visible');
                                observer.unobserve(entry.target);
                            }
                        });
                    },
                    {
                        threshold: CONFIG.animationThreshold,
                        rootMargin: '0px 0px -50px 0px'
                    }
                );

                this.elements.forEach(el => observer.observe(el));
            } else {
                this.elements.forEach(el => el.classList.add('visible'));
            }
        }
    };

    // ========================================
    // ÁLBUM — lista da pasta img/album/ e ordem aleatória
    // ========================================

    const AlbumGallery = {
        fallback: [
            "2pac.webp",
            "bts finalizado.webp",
            "changbin.webp",
            "hyunjin 2.1.webp",
            "hyunjin.webp",
            "Isabella.webp",
            "Jisung 1.webp",
            "Jiung.webp",
            "olivia.webp",
            "Post malone 2.webp",
            "post malone.webp",
            "Rafa.webp",
            "Salgezinho teste 1.webp",
            "skz finalizado.webp",
            "tentiva1.webp",
            "teste teste.webp",
            "Yuta.webp"
        ],

        async init() {
            const grid = document.getElementById("album-grid");
            if (!grid) return;

            const files = this.shuffle(await this.listFiles());
            files.forEach((filename, index) => {
                grid.appendChild(this.createItem(filename, index));
            });
        },

        async listFiles() {
            const fromDirectory = await this.listFromDirectory();
            if (fromDirectory.length) return fromDirectory;

            const fromManifest = await this.listFromManifest();
            if (fromManifest.length) return fromManifest;

            return this.fallback.slice();
        },

        async listFromDirectory() {
            try {
                const response = await fetch("img/album/");
                if (!response.ok) return [];

                const html = await response.text();
                const files = [];
                const hrefs = html.matchAll(/href="([^"]+)"/g);

                for (const match of hrefs) {
                    const href = match[1]
                        .replace(/&amp;/g, "&")
                        .replace(/&#47;/g, "/")
                        .replace(/&#92;/g, "/")
                        .replace(/\\/g, "/");
                    const filename = decodeURIComponent(href.split("/").pop() || "");
                    if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(filename)) continue;
                    files.push(filename);
                }

                return [...new Set(files)];
            } catch (error) {
                return [];
            }
        },

        async listFromManifest() {
            try {
                const response = await fetch("img/album/manifest.json");
                if (!response.ok) return [];
                const files = await response.json();
                if (!Array.isArray(files)) return [];
                return files.filter((name) => typeof name === "string");
            } catch (error) {
                return [];
            }
        },

        shuffle(files) {
            const items = files.slice();
            for (let i = items.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [items[i], items[j]] = [items[j], items[i]];
            }
            return items;
        },

        titleFromFilename(filename) {
            const base = filename.replace(/\.[^.]+$/, "");
            let name = base
                .replace(/[_-]+/g, " ")
                .replace(/\b(finalizado|teste)\b/gi, " ")
                .replace(/\s+\d+(?:\.\d+)?\s*$/g, "")
                .replace(/(\D)(\d+)$/g, "$1 $2")
                .replace(/\s+/g, " ")
                .trim();

            if (!name) {
                name = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
            }

            return name.split(" ").map((word) => {
                const shortLabel = word.length <= 3 && word === word.toLowerCase() && !/\d/.test(word);
                if (shortLabel) return word.toUpperCase();
                return word.charAt(0).toUpperCase() + word.slice(1);
            }).join(" ");
        },

        createItem(filename, index) {
            const title = this.titleFromFilename(filename);
            const item = document.createElement("div");
            item.className = "masonry-item";

            const image = document.createElement("img");
            image.src = `img/album/${encodeURIComponent(filename)}`;
            image.alt = title;
            image.decoding = "async";
            if (index < 4) {
                image.loading = "eager";
                image.setAttribute("fetchpriority", "high");
            } else {
                image.loading = "lazy";
            }

            const overlay = document.createElement("div");
            overlay.className = "masonry-overlay";

            const label = document.createElement("span");
            label.className = "masonry-title";
            label.textContent = title;

            overlay.appendChild(label);
            item.appendChild(image);
            item.appendChild(overlay);
            return item;
        }
    };

    // ========================================
    // LIGHTBOX PARA GALERIA
    // ========================================
    
    const Lightbox = {
        init() {
            const galleryItems = document.querySelectorAll('.masonry-item');
            if (galleryItems.length === 0) return;

            this.createLightbox();
            this.bindEvents(galleryItems);
        },

        createLightbox() {
            const lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-overlay"></div>
                <button class="lightbox-close" aria-label="Fechar">×</button>
                <button class="lightbox-prev" aria-label="Anterior">‹</button>
                <button class="lightbox-next" aria-label="Próxima">›</button>
                <div class="lightbox-content">
                    <img src="" alt="" class="lightbox-image">
                    <p class="lightbox-caption"></p>
                </div>
            `;
            document.body.appendChild(lightbox);
            this.lightbox = lightbox;
            this.currentIndex = 0;
            this.items = [];
        },

        bindEvents(galleryItems) {
            this.items = Array.from(galleryItems);
            
            // Abrir lightbox
            this.items.forEach((item, index) => {
                item.addEventListener('click', () => this.open(index));
            });

            // Fechar lightbox
            this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.close());
            this.lightbox.querySelector('.lightbox-overlay').addEventListener('click', () => this.close());

            // Navegação
            this.lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
            this.lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.next());

            // Teclado
            document.addEventListener('keydown', (e) => {
                if (!this.lightbox.classList.contains('active')) return;
                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowLeft') this.prev();
                if (e.key === 'ArrowRight') this.next();
            });
        },

        open(index) {
            this.currentIndex = index;
            this.updateImage();
            this.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        close() {
            this.lightbox.classList.remove('active');
            document.body.style.overflow = '';
        },

        prev() {
            this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
            this.updateImage();
        },

        next() {
            this.currentIndex = (this.currentIndex + 1) % this.items.length;
            this.updateImage();
        },

        updateImage() {
            const item = this.items[this.currentIndex];
            const img = item.querySelector('img');
            const caption = item.querySelector('.masonry-title');
            
            const lightboxImg = this.lightbox.querySelector('.lightbox-image');
            const lightboxCaption = this.lightbox.querySelector('.lightbox-caption');
            
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = caption ? caption.textContent : '';
        }
    };

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    }

    async function onReady() {
        await AlbumGallery.init();
        ScrollAnimations.init();
        Lightbox.init();
        document.body.classList.add('js-loaded');
        console.log('🎨 SALGE Portfolio carregado!');
    }

    // Adicionar estilos do lightbox
    const lightboxStyles = document.createElement('style');
    lightboxStyles.textContent = `
        .lightbox {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .lightbox.active {
            display: flex;
        }
        
        .lightbox-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
        }
        
        .lightbox-content {
            position: relative;
            z-index: 2;
            max-width: 90vw;
            max-height: 90vh;
            text-align: center;
        }
        
        .lightbox-image {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 4px;
        }
        
        .lightbox-caption {
            color: white;
            margin-top: 1rem;
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .lightbox-close,
        .lightbox-prev,
        .lightbox-next {
            position: absolute;
            z-index: 3;
            background: none;
            border: none;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 1rem;
            line-height: 1;
            transition: opacity 0.3s;
        }
        
        .lightbox-close:hover,
        .lightbox-prev:hover,
        .lightbox-next:hover {
            opacity: 0.7;
        }
        
        .lightbox-close {
            top: 0;
            right: 0;
            font-size: 2.5rem;
        }
        
        .lightbox-prev {
            left: 0;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .lightbox-next {
            right: 0;
            top: 50%;
            transform: translateY(-50%);
        }
        
        @media (max-width: 768px) {
            .lightbox-prev,
            .lightbox-next {
                font-size: 1.5rem;
                padding: 0.5rem;
            }
        }
    `;
    document.head.appendChild(lightboxStyles);

    init();

})();
