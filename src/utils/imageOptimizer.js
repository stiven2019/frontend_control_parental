/**
 * Utilidad para optimizar y comprimir imágenes en el cliente (navegador/móvil)
 * antes de enviarlas al servidor.
 * 
 * Beneficios:
 * - Reduce fotos pesadas de cámaras móviles (de 10-20 MB a ~300-800 KB).
 * - Convierte formatos especiales o no optimizados a JPEG estándar.
 * - Evita errores de cuota de red, 413 Payload Too Large y tiempos de espera en móviles.
 */

export async function compressImageIfPossible(file, {
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85,
} = {}) {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return file;
  }

  // Si no es imagen (por ejemplo un documento PDF), no procesar
  const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name || '');
  if (!isImage) {
    return file;
  }

  // Si ya es muy ligera (menos de 350 KB) y es JPG/PNG/WebP, no hace falta recomprimir
  if (file.size < 350 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // fallback si falla lectura
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file); // fallback si falla imagen
      img.onload = () => {
        try {
          let { width, height } = img;

          // Escalar proporcionalmente si excede las dimensiones máximas
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Fondo blanco para imágenes con transparencia convertidas a JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              // Generar nombre de archivo con extensión .jpg
              const originalName = file.name || 'foto.jpg';
              const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
              const newFileName = `${nameWithoutExt}.jpg`;

              const optimizedFile = new File([blob], newFileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              // Si por alguna razón el comprimido resultó más pesado (raro), conservar el original
              if (optimizedFile.size > file.size && file.type) {
                resolve(file);
              } else {
                resolve(optimizedFile);
              }
            },
            'image/jpeg',
            quality
          );
        } catch (canvasErr) {
          console.warn('Error en canvas durante compresión:', canvasErr);
          resolve(file);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
