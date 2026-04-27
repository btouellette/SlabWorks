import Konva from 'konva';

// Canvas scale: 10 pixels per inch
const PIXELS_PER_INCH = 10;

export function drawTargetArea(
    layer: Konva.Layer,
    widthInches: number,
    heightInches: number,
    shape: 'rectangle' | 'ellipse'
): Konva.Rect | Konva.Ellipse {
    const existing = layer.findOne('#target-area');
    if (existing) existing.destroy();

    const stage = layer.getStage()!;
    const w = widthInches * PIXELS_PER_INCH;
    const h = heightInches * PIXELS_PER_INCH;
    const cx = stage.width() / 2;
    const cy = stage.height() / 2;

    const style = {
        stroke: '#4f46e5',
        strokeWidth: 2,
        dash: [10, 5],
        listening: false,
        id: 'target-area',
    };

    let node: Konva.Rect | Konva.Ellipse;
    if (shape === 'rectangle') {
        node = new Konva.Rect({
            x: cx - w / 2,
            y: cy - h / 2,
            width: w,
            height: h,
            ...style,
        });
    } else {
        node = new Konva.Ellipse({
            x: cx,
            y: cy,
            radiusX: w / 2,
            radiusY: h / 2,
            ...style,
        });
    }

    layer.add(node);
    layer.draw();
    return node;
}
