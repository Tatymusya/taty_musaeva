import { BaseModule } from '../base-module';

/**
 * Модуль навигации
 * Управляет навигационной панелью, активной ссылкой, мобильным меню
 */
export class NavigationModule extends BaseModule {
  private navbar: HTMLElement | null = null;
  private navLinks: NodeListOf<HTMLAnchorElement> | null = null;
  private navToggle: HTMLElement | null = null;
  private navLinksContainer: HTMLElement | null = null;

  // Обработчики событий
  private _onScroll: (() => void) | null = null;
  private _updateActiveNavLink: (() => void) | null = null;
  private _onEscape: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super('Navigation');
  }

  init(): void {
    if (this.initialized) return;

    this.cacheElements();
    this.setupScrollHandler();
    this.setupNavLinks();
    this.setupMobileMenu();
    this.setupSmoothScroll();

    this.initialized = true;
    this.debug('Initialized');
  }

  private cacheElements(): void {
    this.navbar = document.querySelector('.app-navbar');
    this.navLinks = document.querySelectorAll('.app-nav-links__link');
    this.navToggle = document.querySelector('.app-nav-toggle');
    this.navLinksContainer = document.querySelector('.app-nav-links');
  }

  private setupScrollHandler(): void {
    let ticking = false;

    this._onScroll = (): void => {
      const updateNavbar = (): void => {
        const scrollY = window.scrollY;

        if (this.navbar) {
          if (scrollY > 50) {
            this.navbar.classList.add('scrolled');
          } else {
            this.navbar.classList.remove('scrolled');
          }
        }

        ticking = false;
      };

      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    };

    window.addEventListener('scroll', this._onScroll, { passive: true });
  }

  private setupNavLinks(): void {
    if (!this.navLinks) return;

    this._updateActiveNavLink = (): void => {
      const sections = document.querySelectorAll(
        '.app-section'
      ) as NodeListOf<HTMLElement>;
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id') || '';

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          this.navLinks?.forEach(link => {
            link.classList.remove('app-nav-links__link--active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('app-nav-links__link--active');
            }
          });
        }
      });
    };

    window.addEventListener('scroll', this._updateActiveNavLink, {
      passive: true,
    });

    // Инициализация
    this._updateActiveNavLink();
  }

  private setupMobileMenu(): void {
    if (!this.navToggle || !this.navLinksContainer) return;

    this.navToggle.addEventListener('click', () => {
      this.navLinksContainer?.classList.toggle('active');
      this.navToggle?.classList.toggle('active');
    });

    // Закрытие по Escape
    this._onEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.navLinksContainer?.classList.remove('active');
        this.navToggle?.classList.remove('active');
      }
    };

    document.addEventListener('keydown', this._onEscape);
  }

  private setupSmoothScroll(): void {
    if (!this.navLinks) return;

    this.navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const href = link.getAttribute('href');

        if (href && href.startsWith('#')) {
          const target = document.querySelector(href) as HTMLElement;
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });

            // Закрываем мобильное меню
            this.navLinksContainer?.classList.remove('active');
            this.navToggle?.classList.remove('active');
          }
        }
      });
    });
  }

  /**
   * Закрыть мобильное меню
   */
  closeMobileMenu(): void {
    this.navLinksContainer?.classList.remove('active');
    this.navToggle?.classList.remove('active');
  }

  destroy(): void {
    if (this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
    }

    if (this._updateActiveNavLink) {
      window.removeEventListener('scroll', this._updateActiveNavLink);
    }

    if (this._onEscape) {
      document.removeEventListener('keydown', this._onEscape);
    }

    super.destroy();
  }
}
