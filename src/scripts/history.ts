import Konva from 'konva';

type Transform = { x: number; y: number; rotation: number };

export type HistoryEntry =
    | { kind: 'rotate' | 'drag'; node: Konva.Image; before: Transform; after: Transform }
    | { kind: 'place' | 'remove'; slabId: string; node: Konva.Image; x: number; y: number; rotation: number }
    | { kind: 'cut'; originalSlabId: string; node: Konva.Image; x: number; y: number; rotation: number; insideNode: Konva.Image; outsideNode: Konva.Image };

export class History {
    private undoStack: HistoryEntry[] = [];
    private redoStack: HistoryEntry[] = [];

    push(entry: HistoryEntry): void {
        if (entry.kind === 'rotate' && this.undoStack.length > 0) {
            const last = this.undoStack[this.undoStack.length - 1];
            if (last.kind === 'rotate' && last.node === entry.node) {
                last.after = entry.after;
                this.redoStack = [];
                return;
            }
        }
        this.undoStack.push(entry);
        this.redoStack = [];
    }

    undo(): HistoryEntry | undefined {
        const entry = this.undoStack.pop();
        if (entry) this.redoStack.push(entry);
        return entry;
    }

    redo(): HistoryEntry | undefined {
        const entry = this.redoStack.pop();
        if (entry) this.undoStack.push(entry);
        return entry;
    }
}
