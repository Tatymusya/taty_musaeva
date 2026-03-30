import { BaseModule } from '@modules/base-module';
import { easing } from '@core/utils';

/**
 * Модуль анимаций
 * Управляет scroll-анимациями, параллаксом, появлением элементов
 */
export class AnimationModule extends BaseModule {
  private observer: IntersectionObserver | null = null;
  private animatedElements: Set<HTMLElement> = new Set();
  private rafId: number | null = null;
  private _onScroll: (() => void) | null = null;

  constructor() {
    super('Animation');
  }

  init(): void {
    if (this.initialized) return;

    this.setupScrollAnimations();
    this.setupParallax();
    this.setupCounterAnimation();

    this.initialized = true;
    this.debug('Initialized');
  }

  private setupScrollAnimations(): void {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-50px',
      threshold: 0.1,
    };

    const observerCallback: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          element.classList.add('visible');

          // Если это секция, добавляем класс для анимации children
          if (element.classList.contains('section')) {
            this.animateChildren(element);
          }
        }
      });
    };

    this.observer = new IntersectionObserver(observerCallback, observerOptions);

    // Наблюдаем за секциями
    document.querySelectorAll('.section').forEach(section => {
      this.observer?.observe(section);
      this.animatedElements.add(section as HTMLElement);
    });

    // Наблюдаем за карточками проектов
    document
      .querySelectorAll('.project-card, .skill-category, .contact-card')
      .forEach(el => {
        this.observer?.observe(el);
        this.animatedElements.add(el as HTMLElement);
      });
  }

  private animateChildren(parent: HTMLElement): void {
    const children = parent.querySelectorAll<HTMLElement>(
      '.hero-content > *, .about-text > *, .project-content > *, .contact-content > *'
    );

    children.forEach((child, index) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(20px)';

      setTimeout(() => {
        child.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        child.style.opacity = '1';
        child.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  private setupParallax(): void {
    let ticking = false;

    this._onScroll = (): void => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const parallaxElements =
            document.querySelectorAll<HTMLElement>('[data-parallax]');

          parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallaxSpeed || '0.1');
            const rect = element.getBoundingClientRect();

            if (rect.top < window.innerHeight && rect.bottom > 0) {
              const yPos = (window.innerHeight - rect.top) * speed;
              element.style.transform = `translateY(${yPos}px)`;
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', this._onScroll, { passive: true });
  }

  private setupCounterAnimation(): void {
    // Находим элементы с data-animate-counter
    const counters = document.querySelectorAll<HTMLElement>(
      '[data-animate-counter]'
    );

    const animateCounter = (element: HTMLElement): void => {
      const target = parseInt(element.dataset.animateCounter || '0', 10);
      const duration = 2000;
      const startTime = performance.now();

      const update = (currentTime: number): void => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Используем easing функцию
        const easedProgress = easing.easeOutQuart(progress);
        const current = Math.floor(target * easedProgress);

        element.textContent = current.toString();

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    };

    // Анимация при появлении в viewport
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    });

    counters.forEach(counter => observer.observe(counter));
  }

  /**
   * Анимировать значение числа
   */
  animateValue(
    element: HTMLElement,
    start: number,
    end: number,
    duration: number = 2000,
    easingFn: keyof typeof easing = 'easeOutQuart'
  ): void {
    const range = end - start;
    const startTime = performance.now();
    const easeFn = easing[easingFn];

    const update = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = easeFn(progress);
      const current = Math.floor(start + range * easedProgress);

      element.textContent = current.toString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  /**
   * Плавный скролл к элементу
   */
  scrollToElement(element: HTMLElement, offset: number = 0): void {
    const targetPosition = element.offsetTop - offset;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    const startTime = performance.now();

    const animation = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = easing.easeInOutQuart(progress);
      window.scrollTo(0, startPosition + distance * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  /**
   * Добавить класс анимации
   */
  addAnimationClass(
    element: HTMLElement,
    className: string,
    delay: number = 0
  ): void {
    setTimeout(() => {
      element.classList.add(className);
    }, delay);
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.animatedElements.clear();

    if (this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
    }

    super.destroy();
  }
}
