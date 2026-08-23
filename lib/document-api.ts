const apiUrl = (process.env.NEXT_PUBLIC_DOCUMENT_API_URL || '').replace(/\/$/, '');

export function hasDocumentApi() {
  return Boolean(apiUrl);
}

export async function extractDocxWithApi(file: File) {
  if (!apiUrl) throw new Error('Document API is not configured.');
  const body = new FormData();
  body.append('document', file);
  const response = await fetch(`${apiUrl}/v1/documents/extract`, { method: 'POST', body });
  if (!response.ok) throw new Error('The document service could not process this file.');
  return response.json() as Promise<{ html: string; warnings: string[]; storageKey: string | null }>;
}
