import Konva from 'konva';
import localforage from 'localforage';
import { handleImageUpload } from './imageUpload';
import { Slab, ShelvedSlab } from './types';
import "../styles/tailwind.css";

document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded');
    const stage = new Konva.Stage({
        container: 'container',
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    const uploadInput = document.getElementById('imageUpload') as HTMLInputElement;

    uploadInput.addEventListener('change', (event) => handleImageUpload(event, stage, layer, saveSlab));

    async function saveSlab(slab: Slab) {
        const shelf = await loadShelf();
        shelf.slabs.push(slab);
        await localforage.setItem('shelf', shelf);
        displayShelf();
    }

    async function loadShelf(): Promise<{ slabs: ShelvedSlab[] }> {
        const shelf = await localforage.getItem<{ slabs: ShelvedSlab[] }>('shelf');
        if (shelf) {
            console.log('Shelf data loaded from IndexedDB:', shelf);
            return shelf;
        } else {
            const newShelf = { slabs: [] };
            await localforage.setItem('shelf', newShelf);
            return newShelf;
        }
    }

    async function displayShelf() {
        const shelf = await loadShelf();
        console.log('Displaying shelf:', shelf);
        const shelfThumbnails = document.getElementById('shelf-thumbnails')!;
        shelfThumbnails.innerHTML = '';
        shelf.slabs.forEach(slab => {
            const img = document.createElement('img');
            img.src = slab.dataUrl;
            img.className = 'w-full h-auto';
            shelfThumbnails.appendChild(img);
        });
    }

    // Initial display of the shelf
    displayShelf();
});