import Konva from 'konva';

export type CutPiece = {
    dataUrl: string;
    // Pre-attachRotationHandler placement — setupCanvasNode consumes these directly
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
};

export type CutResult = {
    inside: CutPiece;
    outside: CutPiece;
};

function trimCanvas(src: HTMLCanvasElement): { canvas: HTMLCanvasElement; offsetX: number; offsetY: number } {
    const ctx = src.getContext('2d')!;
    const { data } = ctx.getImageData(0, 0, src.width, src.height);
    const w = src.width;
    const h = src.height;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (minX > maxX || minY > maxY) {
        return { canvas: src, offsetX: 0, offsetY: 0 };
    }

    const trimW = maxX - minX + 1;
    const trimH = maxY - minY + 1;
    const out = document.createElement('canvas');
    out.width = trimW;
    out.height = trimH;
    out.getContext('2d')!.drawImage(src, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
    return { canvas: out, offsetX: minX, offsetY: minY };
}

export function cutSlabToTarget(
    slabImage: Konva.Image,
    targetNode: Konva.Rect | Konva.Ellipse
): CutResult | null {
    const isEllipse = targetNode instanceof Konva.Ellipse;

    let targetLeft: number, targetTop: number, targetW: number, targetH: number;
    let targetCX: number, targetCY: number, radiusX: number, radiusY: number;
    if (isEllipse) {
        const el = targetNode as Konva.Ellipse;
        targetCX = el.x();
        targetCY = el.y();
        radiusX = el.radiusX();
        radiusY = el.radiusY();
        targetLeft = targetCX - radiusX;
        targetTop = targetCY - radiusY;
        targetW = radiusX * 2;
        targetH = radiusY * 2;
    } else {
        const rect = targetNode as Konva.Rect;
        targetLeft = rect.x();
        targetTop = rect.y();
        targetW = rect.width();
        targetH = rect.height();
        targetCX = targetLeft + targetW / 2;
        targetCY = targetTop + targetH / 2;
        radiusX = 0;
        radiusY = 0;
    }

    const slabRect = slabImage.getClientRect();
    if (
        slabRect.x + slabRect.width < targetLeft ||
        slabRect.x > targetLeft + targetW ||
        slabRect.y + slabRect.height < targetTop ||
        slabRect.y > targetTop + targetH
    ) {
        return null;
    }

    const slabX = slabImage.x();
    const slabY = slabImage.y();
    const rotRad = slabImage.rotation() * Math.PI / 180;
    const sx = slabImage.scaleX();
    const sy = slabImage.scaleY();
    const imgW = slabImage.width();
    const imgH = slabImage.height();
    const img = slabImage.image() as HTMLImageElement;

    // --- Inside piece ---
    const insideCanvas = document.createElement('canvas');
    insideCanvas.width = targetW;
    insideCanvas.height = targetH;
    const insideCtx = insideCanvas.getContext('2d')!;

    insideCtx.beginPath();
    if (isEllipse) {
        insideCtx.ellipse(targetW / 2, targetH / 2, radiusX, radiusY, 0, 0, Math.PI * 2);
    } else {
        insideCtx.rect(0, 0, targetW, targetH);
    }
    insideCtx.clip();

    insideCtx.save();
    insideCtx.translate(slabX - targetLeft, slabY - targetTop);
    insideCtx.rotate(rotRad);
    insideCtx.scale(sx, sy);
    insideCtx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
    insideCtx.restore();

    const { canvas: insideTrimmed, offsetX: inOffX, offsetY: inOffY } = trimCanvas(insideCanvas);
    // Inside is in stage-coord space (no rotation/scale), trimmed origin is (targetLeft+inOffX, targetTop+inOffY)
    // Pre-attachRotationHandler x: target_x + inOffX  (handler adds trimW/2, centering the image)
    const inside: CutPiece = {
        dataUrl: insideTrimmed.toDataURL(),
        x: targetLeft + inOffX,
        y: targetTop + inOffY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
    };

    // --- Outside piece ---
    const outsideCanvas = document.createElement('canvas');
    outsideCanvas.width = imgW;
    outsideCanvas.height = imgH;
    const outsideCtx = outsideCanvas.getContext('2d')!;

    outsideCtx.drawImage(img, 0, 0, imgW, imgH);

    // Apply the inverse of the slab's world transform so stage-coord target shape maps to slab-local canvas coords.
    outsideCtx.globalCompositeOperation = 'destination-out';
    outsideCtx.save();
    outsideCtx.translate(imgW / 2, imgH / 2);
    outsideCtx.scale(1 / sx, 1 / sy);
    outsideCtx.rotate(-rotRad);
    outsideCtx.translate(-slabX, -slabY);
    outsideCtx.beginPath();
    if (isEllipse) {
        outsideCtx.ellipse(targetCX, targetCY, radiusX, radiusY, 0, 0, Math.PI * 2);
    } else {
        outsideCtx.rect(targetLeft, targetTop, targetW, targetH);
    }
    outsideCtx.fill();
    outsideCtx.restore();
    outsideCtx.globalCompositeOperation = 'source-over';

    const { canvas: outsideTrimmed, offsetX: outOffX, offsetY: outOffY } = trimCanvas(outsideCanvas);
    const trimW = outsideTrimmed.width;
    const trimH = outsideTrimmed.height;

    // Map the trimmed content's center from canvas-local to stage coordinates.
    // Canvas origin = slab image top-left; slab center = (imgW/2, imgH/2) in canvas = (slabX, slabY) in stage.
    const localDX = (outOffX + trimW / 2 - imgW / 2) * sx;
    const localDY = (outOffY + trimH / 2 - imgH / 2) * sy;
    const worldCX = slabX + localDX * Math.cos(rotRad) - localDY * Math.sin(rotRad);
    const worldCY = slabY + localDX * Math.sin(rotRad) + localDY * Math.cos(rotRad);

    const outside: CutPiece = {
        dataUrl: outsideTrimmed.toDataURL(),
        // Pre-attachRotationHandler: handler adds trimW/2, so x_post = worldCX as required
        x: worldCX - trimW / 2,
        y: worldCY - trimH / 2,
        rotation: slabImage.rotation(),
        scaleX: sx,
        scaleY: sy,
    };

    return { inside, outside };
}
