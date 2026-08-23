export type PdfEditorColor = {
  r: number;
  g: number;
  b: number;
};

export type PdfEditorPoint = {
  x: number;
  y: number;
};

export type PdfEditorImageData = string | ArrayBuffer | Uint8Array;

export type PdfEditorOperation =
  | { type: 'rotate-pages'; pages: readonly number[]; degrees: 90 | 180 | 270 | -90 | -180 | -270 }
  | { type: 'delete-pages'; pages: readonly number[] }
  | { type: 'reorder-pages'; pages: readonly number[] }
  | { type: 'extract-pages'; pages: readonly number[] }
  | { type: 'add-text'; page: number; x: number; y: number; text: string; fontSize?: number; color?: PdfEditorColor; opacity?: number }
  | { type: 'add-shape'; page: number; shape: 'rectangle' | 'ellipse' | 'line'; x: number; y: number; width?: number; height?: number; color?: PdfEditorColor; fillColor?: PdfEditorColor; borderWidth?: number; opacity?: number }
  | { type: 'add-image' | 'add-signature'; page: number; data: PdfEditorImageData; x: number; y: number; width: number; height: number; opacity?: number }
  | { type: 'draw'; page: number; points: readonly PdfEditorPoint[]; color?: PdfEditorColor; width?: number; opacity?: number }
  | { type: 'highlight'; page: number; x: number; y: number; width: number; height: number; color?: PdfEditorColor; opacity?: number }
  | { type: 'set-metadata'; title?: string; author?: string; subject?: string; keywords?: readonly string[] };

export interface PdfEditorOptions {
  operations?: readonly PdfEditorOperation[];
  wasmUrl?: string;
}