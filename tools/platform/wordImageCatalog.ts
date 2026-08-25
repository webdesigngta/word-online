import type { PlatformToolDefinition } from './catalog';

export const liveWordImageTools: readonly PlatformToolDefinition[] = [
  {
    id: 'word-to-jpg', route: '/word-to-jpg', name: 'Word to JPG',
    title: 'Word to JPG – Convert Word Document to JPG Online',
    description: 'Convert DOCX Word document pages into high-quality JPG images directly in your browser.',
    eyebrow: 'WORD TO JPG', primaryIntent: 'Convert Word to JPG', kind: 'converter', cluster: 'Word', priority: 'P1', stage: 'Next',
    secondaryKeywords: ['convert word to jpg', 'word to jpg converter', 'convert docx to jpg', 'word document to jpg'], input: ['docx'], output: ['jpg'], processor: 'wordToImageProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'word-to-png', route: '/word-to-png', name: 'Word to PNG',
    title: 'Word to PNG – Convert Word Document to PNG Online',
    description: 'Convert DOCX Word document pages into PNG images in your browser with high-resolution output.',
    eyebrow: 'WORD TO PNG', primaryIntent: 'Convert Word to PNG', kind: 'converter', cluster: 'Word', priority: 'P2', stage: 'Next',
    secondaryKeywords: ['convert word to png', 'word to png converter', 'convert docx to png', 'word document to png'], input: ['docx'], output: ['png'], processor: 'wordToImageProcessor', launchState: 'live', indexable: true,
  },
];
