import Konva from 'konva';

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

    uploadInput.addEventListener('change', handleImageUpload);
    dimensionInput.addEventListener('input', simulateCuts);

    function handleImageUpload(event: Event) {
        const file = (event.target as HTMLInputElement).files![0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
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
                };
            };
            reader.readAsDataURL(file);
        }
    }

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

    function saveUserData() {
        const userData = {
            image: uploadInput.value,
            dimensions: dimensionInput.value
        };
        localStorage.setItem('woodSlabData', JSON.stringify(userData));
    }

    window.addEventListener('beforeunload', saveUserData);
});