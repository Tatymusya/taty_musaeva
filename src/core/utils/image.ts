// src/core/utils/image.ts
export interface ImageSet {
  avif?: string;
  webp?: string;
  original: string;
  lqip?: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
}

export function createResponsiveImage(images: ImageSet): HTMLElement {
  const picture = document.createElement('picture');

  if (images.avif) {
    const sourceAvif = document.createElement('source');
    sourceAvif.srcset = images.avif;
    sourceAvif.type = 'image/avif';
    picture.appendChild(sourceAvif);
  }

  if (images.webp) {
    const sourceWebp = document.createElement('source');
    sourceWebp.srcset = images.webp;
    sourceWebp.type = 'image/webp';
    picture.appendChild(sourceWebp);
  }

  const img = document.createElement('img');
  img.src = images.original;
  img.alt = images.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = images.width;
  img.height = images.height;
  if (images.className) img.className = images.className;

  if (images.lqip) {
    img.style.background = `url(${images.lqip}) center/cover`;
    img.style.filter = 'blur(8px)';
    img.onload = () => { img.style.filter = 'blur(0)'; };
  }

  picture.appendChild(img);
  return picture;
}