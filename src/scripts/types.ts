// Represents a movement applied to a slab from its current position (including the shelf) to the target area
export interface MoveTransformation {
    type: 'move';
    x: number; // These are from the center of the target area
    y: number;
}

// Represents a rotation applied to a slab
export interface RotateTransformation {
    type: 'rotate';
    rotation: number; // in degrees, about the center of the slab
}

// Represents a cut applied to a slab
// A cut will always be along all intersections between the current slab position and the target area
export interface CutTransformation {
    type: 'cut';
    resultingSlabs: Slab[];
}

// Represents a removal of a slab back to the shelf
export interface RemoveTransformation {
    type: 'remove';
}

// Union type for all possible transformations
export type Transformation = MoveTransformation | RotateTransformation | CutTransformation | RemoveTransformation;

// Represents a slab of wood, current x/y/rotation are derived ffom the transformations
export interface Slab {
    id: string;
    dataUrl: string; // Locally encoded base64 image
    width: number;
    height: number;
    cutSlabs: Slab[];
}

// Represents the target area for the final product
export interface TargetArea {
    type: 'rectangle' | 'ellipse';
    width: number;
    height: number;
}

// Represents a user command for undo/redo functionality
export interface Command {
    slab: Slab;
    transformation: Transformation;
}

// Represents a project containing multiple slabs and a target area
export interface Project {
    name: string;
    slabs: Slab[];
    targetArea: TargetArea;
    transformations: Transformation[]; // The final transformation for a slab should be empty or a cut at which point further transformations are on the resultingSlabs from the CutTransformation
}

// Represents a list of projects, this is what is serialized to localStorage
export interface ProjectList {
    projects: Project[];
}