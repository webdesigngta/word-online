export interface DocumentModel {
  id: string;
  name: string;
  type: 'docx' | 'pdf' | 'spreadsheet' | 'text';
  content: unknown;
  createdAt: number;
  updatedAt: number;
}

export function createDocument(
  name: string,
  type: DocumentModel['type'],
): DocumentModel {
  const now = Date.now();

  return {
    id: crypto.randomUUID(),
    name,
    type,
    content: null,
    createdAt: now,
    updatedAt: now,
  };
}
