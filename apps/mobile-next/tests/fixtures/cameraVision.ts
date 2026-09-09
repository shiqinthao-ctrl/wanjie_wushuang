import type { Page } from '@playwright/test';

// Locate the hero from the rendered portrait, without accessing battle state.
export async function captureHero(page: Page) {
  const png = await page.screenshot({ scale: 'css' });
  const frame = await page.evaluate(async encoded => {
    const image = new Image(); image.src = `data:image/png;base64,${encoded}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let x = 0, y = 0, count = 0;
    const columns = new Map<number, number>(), rows = new Map<number, number>();
    for (let i = 0; i < pixels.length; i += 4) {
      const px = (i / 4) % canvas.width, py = Math.floor(i / 4 / canvas.width);
      if ([213, 155, 114].every((value, channel) => Math.abs(pixels[i + channel]! - value) < 4)) {
        x += px; y += py; count++;
      }
      // Long gold lines in the central band identify the actual world corner.
      if (Math.abs(py - canvas.height / 2) < 110 &&
          [170, 163, 121].every((value, channel) => Math.abs(pixels[i + channel]! - value) < 3)) {
        columns.set(px, (columns.get(px) ?? 0) + 1);
        rows.set(py, (rows.get(py) ?? 0) + 1);
      }
    }
    const longest = (values: Map<number, number>) => [...values].sort((a, b) => b[1] - a[1])[0];
    const column = longest(columns), row = longest(rows);
    return {
      hero: count >= 6 ? { x: x / count, y: y / count + 36, count } : null,
      boundary: column && row && column[1] > 40 && row[1] > 40 ? { x: column[0], y: row[0] } : null,
    };
  }, png.toString('base64'));
  return { png, ...frame };
}
