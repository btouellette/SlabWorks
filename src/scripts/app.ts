import Konva from 'konva';
import localforage from 'localforage';
import { handleImageUpload } from './imageUpload';
import { Slab, ShelvedSlab } from './types';
import { generateId } from './utils';
import "../styles/tailwind.css";

document.addEventListener('DOMContentLoaded', () => {
    const containerEl = document.getElementById('container')!;
    const stage = new Konva.Stage({
        container: 'container',
        width: containerEl.clientWidth,
        height: containerEl.clientHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    const placedSlabs = new Map<string, Konva.Image>();

    const uploadInput = document.getElementById('imageUpload') as HTMLInputElement;
    uploadInput.addEventListener('change', (event) => handleImageUpload(event, saveSlab));

    async function saveSlab(slab: Slab) {
        const shelf = await loadShelf();
        shelf.slabs.push(slab);
        await localforage.setItem('shelf', shelf);
        displayShelf();
    }

    async function loadShelf(): Promise<{ slabs: ShelvedSlab[] }> {
        const shelf = await localforage.getItem<{ slabs: ShelvedSlab[] }>('shelf');
        if (shelf) {
            let needsSave = false;
            shelf.slabs.forEach(slab => {
                if (!slab.id) {
                    (slab as ShelvedSlab).id = generateId();
                    needsSave = true;
                }
            });
            if (needsSave) await localforage.setItem('shelf', shelf);
            return shelf;
        } else {
            const newShelf = { slabs: [] };
            await localforage.setItem('shelf', newShelf);
            return newShelf;
        }
    }

    function placeSlabOnCanvas(slab: ShelvedSlab) {
        if (placedSlabs.has(slab.id)) return;

        const imageObj = new Image();
        imageObj.src = slab.dataUrl;
        imageObj.onload = () => {
            const konvaImage = new Konva.Image({
                image: imageObj,
                x: stage.width() / 2 - imageObj.width / 2,
                y: stage.height() / 2 - imageObj.height / 2,
                draggable: true,
            });
            layer.add(konvaImage);
            layer.draw();
            placedSlabs.set(slab.id, konvaImage);
            updateThumbnailIndicator(slab.id, true);
        };
    }

    function updateThumbnailIndicator(slabId: string, isOnCanvas: boolean) {
        const thumb = document.querySelector<HTMLImageElement>(`[data-slab-id="${slabId}"]`);
        if (!thumb) return;
        if (isOnCanvas) {
            thumb.classList.add('ring-2', 'ring-indigo-500');
        } else {
            thumb.classList.remove('ring-2', 'ring-indigo-500');
        }
    }

    async function displayShelf() {
        const shelf = await loadShelf();
        const shelfThumbnails = document.getElementById('shelf-thumbnails')!;
        shelfThumbnails.innerHTML = '';
        shelf.slabs.forEach(slab => {
            const img = document.createElement('img');
            img.src = slab.dataUrl;
            img.className = 'w-full h-auto cursor-pointer rounded';
            img.dataset.slabId = slab.id;
            if (placedSlabs.has(slab.id)) {
                img.classList.add('ring-2', 'ring-indigo-500');
            }
            img.addEventListener('click', () => placeSlabOnCanvas(slab));
            shelfThumbnails.appendChild(img);
        });
    }

    displayShelf();
});
