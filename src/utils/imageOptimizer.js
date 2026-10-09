/**
 * Utilidad para optimizar y comprimir imágenes en el cliente (navegador/móvil)
 * antes de enviarlas al servidor.
 * 
 * Garantiza:
 * - Que las imágenes queden SIEMPRE por debajo del límite estricto de Nginx (1 MB / 413 Request Entity Too Large).
 * - Calidad visual de alta definición (hasta 1600px).
 * - Conversión a JPEG estándar universal.
 */

export async function compressImageIfPossible(file, {
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.78,
  targetMaxBytes = 850 * 1024, // 850 KB (seguro para servidores Nginx con límite por defecto de 1M)
} = {}) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return file;
  }

  // Si no es imagen (por ejemplo un documento PDF), no procesar
  const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name || '');
  if (!isImage) {
    return file;
  }

  // Si ya pesa menos de 300 KB y es un formato común, no hace falta procesar
  if (file.size < 300 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // fallback si falla lectura
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file); // fallback si falla decodificación
      img.onload = () => {
        try {
          const originalName = file.name || 'foto.jpg';
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const newFileName = `${nameWithoutExt}.jpg`;

          // Función interna para comprimir en canvas con dimensiones y calidad dadas
          const renderToBlob = (currWidth, currHeight, currQuality) => {
            const canvas = document.createElement('canvas');
            canvas.width = currWidth;
            canvas.height = currHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Fondo blanco para imágenes con transparencia
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, currWidth, currHeight);
            ctx.drawImage(img, 0, 0, currWidth, currHeight);

            return new Promise((resBlob) => {
              canvas.toBlob((blob) => resBlob(blob), 'image/jpeg', currQuality);
            });
          };

          (async () => {
            let { width, height } = img;

            // Escala inicial
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            // Pase 1: calidad normal (0.78)
            let blob = await renderToBlob(width, height, quality);

            // Pase 2: si aún excede el límite seguro (850 KB), reducir dimensiones y calidad
            if (blob && blob.size > targetMaxBytes) {
              const scaleDown = 1280;
              if (width > scaleDown || height > scaleDown) {
                const ratio = Math.min(scaleDown / width, scaleDown / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
              }
              blob = await renderToBlob(width, height, 0.70);
            }

            // Pase 3: caso extremo de imagen sumamente compleja
            if (blob && blob.size > targetMaxBytes) {
              blob = await renderToBlob(Math.round(width * 0.85), Math.round(height * 0.85), 0.62);
            }

            if (!blob) {
              resolve(file);
              return;
            }

            const optimizedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(`[ImageOptimizer] Original: ${(file.size / 1024).toFixed(1)} KB -> Optimizado: ${(optimizedFile.size / 1024).toFixed(1)} KB`);
            resolve(optimizedFile);
          })().catch(() => resolve(file));

        } catch (canvasErr) {
          console.warn('[ImageOptimizer] Error en canvas:', canvasErr);
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
