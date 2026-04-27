import Konva from 'konva';

type RotateCallback = (before: { x: number; y: number; rotation: number }, after: { x: number; y: number; rotation: number }) => void;

export function attachRotationHandler(image: Konva.Image, layer: Konva.Layer, onRotate?: RotateCallback): void {
    const w = image.width();
    const h = image.height();
    image.x(image.x() + w / 2);
    image.y(image.y() + h / 2);
    image.offsetX(w / 2);
    image.offsetY(h / 2);

    image.on('wheel', (evt) => {
        evt.evt.preventDefault();
        const before = { x: image.x(), y: image.y(), rotation: image.rotation() };
        let rotation = image.rotation() + evt.evt.deltaY * 0.1;
        if (evt.evt.shiftKey) {
            rotation = Math.round(rotation / 45) * 45;
        }
        image.rotation(rotation);
        layer.batchDraw();
        if (onRotate) {
            onRotate(before, { x: image.x(), y: image.y(), rotation: image.rotation() });
        }
    });
}
