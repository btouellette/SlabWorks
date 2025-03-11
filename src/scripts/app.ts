import Konva from 'konva';
import { handleImageUpload } from './imageUpload';
import { Project, Slab, TargetArea } from './types';
import "../styles/tailwind.css";

document.addEventListener('DOMContentLoaded', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    const uploadInput = document.getElementById('imageUpload') as HTMLInputElement;
    const dimensionInput = document.getElementById('dimensions') as HTMLInputElement;

    uploadInput.addEventListener('change', (event) => handleImageUpload(event, stage, layer, saveSlab));
    dimensionInput.addEventListener('input', simulateCuts);

    function simulateCuts() {
        const dimensions = dimensionInput.value.split('x').map(Number);
        if (dimensions.length === 2) {
            const [width, height] = dimensions;
            const rect = new Konva.Rect({
                x: 0,
                y: 0,
                width: width,
                height: height,
                stroke: 'red',
                strokeWidth: 2,
            });
            layer.add(rect);
            layer.draw();
        }
    }

    function saveSlab(slab: Slab) {
        const project = loadProject();
        project.slabs.push(slab);
        localStorage.setItem('currentProject', JSON.stringify(project));
    }

    function loadProject(): Project {
        const projectData = localStorage.getItem('currentProject');
        if (projectData) {
            return JSON.parse(projectData) as Project;
        } else {
            const newProject: Project = {
                name: 'My Project',
                slabs: [],
                targetArea: {
                    type: 'rectangle',
                    width: 800,
                    height: 600,
                },
                transformations: [],
            };
            localStorage.setItem('currentProject', JSON.stringify(newProject));
            return newProject;
        }
    }

    function saveUserData() {
        const userData = {
            image: uploadInput.value,
            dimensions: dimensionInput.value
        };
        localStorage.setItem('woodSlabData', JSON.stringify(userData));
    }

    window.addEventListener('beforeunload', saveUserData);
});