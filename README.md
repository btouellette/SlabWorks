# SlabWorks

## Overview
SlabWorks is a web application that allows users to upload images of wood slabs, specify their dimensions, and simulate cuts. This tool is designed for woodworkers and hobbyists who want to visualize their projects before making physical cuts.

## Features
- Upload images of wood slabs.
- Input dimensions for the slabs.
- Simulate cuts on the uploaded images.
- User-friendly interface with drag-and-drop functionality.
- Local storage support for saving user data.

## Usage
- To upload an image, click on the upload button in the interface.
- Enter the dimensions of the wood slab in the provided input fields.
- Use the simulation tools to visualize cuts on the uploaded image.

~~1. Setup and Initialization~~
~~Initialize the Project: Ensure all dependencies are installed and the project structure is set up correctly.~~
~~Create Basic HTML Structure: Set up the basic HTML structure with elements for file upload, dimension input, and a container for the canvas.~~
~~2. Define Types and Interfaces~~
~~Create Types: Define the types and interfaces in types.ts to represent slabs, transformations, target areas, projects, and the project list.~~
3. Canvas Setup and Image Upload
~~Initialize Konva Stage and Layer: Set up the Konva stage and layer in app.ts.~~
Handle Image Upload: Implement the functionality to upload images and display them on the canvas.
4. Slab Transformations
Move Slabs: Implement the functionality to move slabs around the canvas.
Rotate Slabs: Implement the functionality to rotate slabs using the mouse wheel or an alternate key.
Cut Slabs: Implement the functionality to cut slabs along the edges of the target area.
5. Target Area
Define Target Area: Implement the functionality to define the target area (rectangle or ellipse) and display it on the canvas.
6. Undo/Redo Functionality
Track Transformations: Implement the functionality to track transformations in a linear list to support undo/redo.
Undo/Redo Commands: Implement the functionality to undo and redo transformations.
7. Save and Load Projects
Save Projects to LocalStorage: Implement the functionality to save the current project and its transformations to localStorage.
Load Projects from LocalStorage: Implement the functionality to load projects and their transformations from localStorage.
8. User Interface Enhancements
Add UI Elements: Add UI elements for undo/redo buttons, save/load buttons, and any other necessary controls.
Style the Application: Apply CSS styles to make the application visually appealing and user-friendly.
9. Testing and Debugging
Test Functionality: Thoroughly test all functionalities to ensure they work as expected.
Debug Issues: Fix any bugs or issues that arise during testing.
10. Deployment
Deploy to GitHub Pages: Set up the project to be served from GitHub Pages.
Final Testing: Perform final testing to ensure the application works correctly in the deployed environment.