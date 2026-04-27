import { Slab } from './types';
import { generateId } from './utils';

export function handleImageUpload(event: Event, saveSlab: (slab: Slab) => void) {
    const file = (event.target as HTMLInputElement).files![0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e: ProgressEvent<FileReader>) {
            const imageObj = new Image();
            imageObj.src = e.target!.result as string;
            imageObj.onload = () => {
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
