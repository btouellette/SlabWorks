import Konva from 'konva';
import localforage from 'localforage';
import { handleImageUpload } from './imageUpload';
import { Slab, ShelvedSlab, TargetArea } from './types';
import { generateId } from './utils';
import { drawTargetArea } from './targetArea';
import { attachRotationHandler } from './slabControls';
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

    const targetLayer = new Konva.Layer();
    stage.add(targetLayer);

    const transformer = new Konva.Transformer();
    layer.add(transformer);

    const placedSlabs = new Map<string, Konva.Image>();
    let selectedSlabId: string | null = null;

    let currentTargetArea: TargetArea = { type: 'rectangle', width: 24, height: 48 };

    function redrawTargetArea() {
        drawTargetArea(targetLayer, currentTargetArea.width, currentTargetArea.height, currentTargetArea.type);
    }

    const widthInput = document.getElementById('target-width') as HTMLInputElement;
    const heightInput = document.getElementById('target-height') as HTMLInputElement;
    const shapeSelect = document.getElementById('target-shape') as HTMLSelectElement;

    function saveTargetAreaSettings() {
        localforage.setItem('targetArea', currentTargetArea);
    }

    widthInput.addEventListener('input', () => {
        currentTargetArea = { ...currentTargetArea, width: Number(widthInput.value) || 24 };
        redrawTargetArea();
        saveTargetAreaSettings();
    });
    heightInput.addEventListener('input', () => {
        currentTargetArea = { ...currentTargetArea, height: Number(heightInput.value) || 48 };
        redrawTargetArea();
        saveTargetAreaSettings();
    });
    shapeSelect.addEventListener('change', () => {
        currentTargetArea = { ...currentTargetArea, type: shapeSelect.value as 'rectangle' | 'ellipse' };
        redrawTargetArea();
        saveTargetAreaSettings();
    });

    localforage.getItem<TargetArea>('targetArea').then(saved => {
        if (saved) {
            currentTargetArea = saved;
            widthInput.value = String(saved.width);
            heightInput.value = String(saved.height);
            shapeSelect.value = saved.type;
        }
        redrawTargetArea();
    });

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
                id: slab.id,
                image: imageObj,
                x: stage.width() / 2 - imageObj.width / 2,
                y: stage.height() / 2 - imageObj.height / 2,
                draggable: true,
            });
            konvaImage.on('click', () => {
                selectedSlabId = slab.id;
                transformer.nodes([konvaImage]);
                layer.batchDraw();
            });
            layer.add(konvaImage);
            attachRotationHandler(konvaImage, layer);
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

    stage.on('click', (evt) => {
        if (evt.target === stage) {
            selectedSlabId = null;
            transformer.nodes([]);
            layer.batchDraw();
        }
    });

    document.addEventListener('keydown', (evt) => {
        if ((evt.key === 'Delete' || evt.key === 'Backspace') && selectedSlabId) {
            const node = placedSlabs.get(selectedSlabId);
            if (node) node.destroy();
            placedSlabs.delete(selectedSlabId);
            updateThumbnailIndicator(selectedSlabId, false);
            selectedSlabId = null;
            transformer.nodes([]);
            layer.batchDraw();
        }
    });

    displayShelf();
});
