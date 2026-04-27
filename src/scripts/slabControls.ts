import Konva from 'konva';

export function attachRotationHandler(image: Konva.Image, layer: Konva.Layer): void {
    const w = image.width();
    const h = image.height();
    image.x(image.x() + w / 2);
    image.y(image.y() + h / 2);
    image.offsetX(w / 2);
    image.offsetY(h / 2);

    image.on('wheel', (evt) => {
        evt.evt.preventDefault();
        let rotation = image.rotation() + evt.evt.deltaY * 0.1;
        if (evt.evt.shiftKey) {
            rotation = Math.round(rotation / 45) * 45;
        }
        image.rotation(rotation);
        layer.batchDraw();
    });
}
