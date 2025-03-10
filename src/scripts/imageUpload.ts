import Konva from 'konva';
import { Slab } from './types';

export function handleImageUpload(event: Event, stage: Konva.Stage, layer: Konva.Layer, saveSlab: (slab: Slab) => void) {
    const file = (event.target as HTMLInputElement).files![0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            const imageObj = new Image();
            imageObj.src = e.target!.result as string;
            imageObj.onload = () => {
                const konvaImage = new Konva.Image({
                    image: imageObj,
                    x: stage.width() / 2 - imageObj.width / 2,
                    y: stage.height() / 2 - imageObj.height / 2,
                    draggable: true,
                });

                layer.add(konvaImage);
                layer.draw();

                konvaImage.on('wheel', (e: Konva.KonvaEventObject<WheelEvent>) => {
                    e.evt.preventDefault();
                    const oldScale = konvaImage.scaleX();
                    const pointer = stage.getPointerPosition();
                    const mousePointTo = {
                        x: (pointer!.x - konvaImage.x()) / oldScale,
                        y: (pointer!.y - konvaImage.y()) / oldScale,
                    };

                    const newScale = e.evt.deltaY > 0 ? oldScale * 1.1 : oldScale / 1.1;
                    konvaImage.scale({ x: newScale, y: newScale });

                    const newPos = {
                        x: pointer!.x - mousePointTo.x * newScale,
                        y: pointer!.y - mousePointTo.y * newScale,
                    };
                    konvaImage.position(newPos);
                    layer.batchDraw();
                });

                // Save slab data
                const slab: Slab = {
                    id: generateId(),
                    dataUrl: imageObj.src,
                    width: imageObj.width,
                    height: imageObj.height,
                    cutSlabs: [],
                };
                saveSlab(slab);
            };
        };
        reader.readAsDataURL(file);
    }
}

function generateId(): string {
    return '_' + Math.random().toString(36).substr(2, 9);
}