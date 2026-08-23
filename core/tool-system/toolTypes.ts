export type ToolCategory =
  | 'document'
  | 'pdf'
  | 'spreadsheet'
  | 'image'
  | 'converter';

export interface PlatformTool {
  id: string;
  name: string;
  route: string;
  category: ToolCategory;
  description: string;
  enabled: boolean;
}
