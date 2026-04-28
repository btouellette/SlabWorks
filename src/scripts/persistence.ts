import localforage from 'localforage';
import { ShelvedSlab, TargetArea } from './types';

export type PlacedSlab = ShelvedSlab & {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
};

export type ProjectSnapshot = {
    targetArea: TargetArea;
    slabs: PlacedSlab[];
};

type StoredProjects = Record<string, ProjectSnapshot>;

export async function saveProject(name: string, project: ProjectSnapshot): Promise<void> {
    const existing = (await localforage.getItem<StoredProjects>('projects')) ?? {};
    existing[name] = project;
    await localforage.setItem('projects', existing);
}

export async function loadProject(name: string): Promise<ProjectSnapshot | null> {
    const existing = await localforage.getItem<StoredProjects>('projects');
    return existing?.[name] ?? null;
}

export async function listProjects(): Promise<string[]> {
    const existing = await localforage.getItem<StoredProjects>('projects');
    return existing ? Object.keys(existing) : [];
}
