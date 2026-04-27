import { Slab } from './types';
import { generateId } from './utils';

function trimTransparency(img: HTMLImageElement): { dataUrl: string; width: number; height: number } {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Fully transparent image — return as-is
    if (minX > maxX || minY > maxY) {
        return { dataUrl: canvas.toDataURL(), width: img.width, height: img.height };
    }

    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;
    const trimmed = document.createElement('canvas');
    trimmed.width = trimmedWidth;
    trimmed.height = trimmedHeight;
    trimmed.getContext('2d')!.drawImage(canvas, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

    return { dataUrl: trimmed.toDataURL(), width: trimmedWidth, height: trimmedHeight };
}

export function handleImageUpload(event: Event, saveSlab: (slab: Slab) => void) {
    const file = (event.target as HTMLInputElement).files![0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            const imageObj = new Image();
            imageObj.src = e.target!.result as string;
            imageObj.onload = () => {
                const { dataUrl, width, height } = trimTransparency(imageObj);
                const slab: Slab = {
                    id: generateId(),
                    dataUrl,
                    width,
                    height,
                    cutSlabs: [],
                };
                saveSlab(slab);
            };
        };
        reader.readAsDataURL(file);
    }
}
