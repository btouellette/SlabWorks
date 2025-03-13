import Konva from 'konva';
import { Slab } from './types';

export function handleImageUpload(event: Event, stage: Konva.Stage, layer: Konva.Layer, saveSlab: (slab: Slab) => void) {
    console.log('Handling image upload');
    const file = (event.target as HTMLInputElement).files![0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            const imageObj = new Image();
            imageObj.src = e.target!.result as string;
            imageObj.onload = () => {
                // Save slab data
                const slab: Slab = {
                    dataUrl: imageObj.src,
                    width: imageObj.width,
                    height: imageObj.height,
                    cutSlabs: [],
                };
                console.log('Saving slab:', slab);
                saveSlab(slab);
            };
        };
        reader.readAsDataURL(file);
    }
}