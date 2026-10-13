/** Read an image file, downscale it and return a JPEG/PNG data URL that is small enough for localStorage. */
export function fileToDataUrl(file, { max = 900, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) return reject(new Error('Please choose a PNG, JPG, WEBP, GIF or SVG image.'));
    if (file.size > 4 * 1024 * 1024) return reject(new Error('Image is larger than 4 MB.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') return resolve(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error('This image could not be processed.'));
      img.onload = () => {
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
