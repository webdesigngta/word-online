import type { PlatformToolDefinition } from './catalog';

export const livePdfSecurityTools: readonly PlatformToolDefinition[] = [
  {
    id: 'protect-pdf', route: '/protect-pdf', name: 'Protect PDF',
    title: 'Protect PDF – Password Protect PDF Online',
    description: 'Add 256-bit password encryption to a PDF in your browser and download a separate protected copy.',
    eyebrow: 'PROTECT PDF', primaryIntent: 'Add password protection to a PDF', kind: 'pdf', cluster: 'PDF', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['password protect pdf', 'encrypt pdf', 'lock pdf', 'secure pdf'], input: ['pdf', 'password'], output: ['pdf'], processor: 'pdfSecurityProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'unlock-pdf', route: '/unlock-pdf', name: 'Unlock PDF',
    title: 'Unlock PDF – Remove PDF Password Online',
    description: 'Remove password encryption from a PDF when you know a valid password, then download a separate unlocked copy.',
    eyebrow: 'UNLOCK PDF', primaryIntent: 'Remove PDF password encryption with a known password', kind: 'pdf', cluster: 'PDF', priority: 'P1', stage: 'PDF Expansion',
    secondaryKeywords: ['remove pdf password', 'decrypt pdf', 'unlock password protected pdf'], input: ['pdf', 'password'], output: ['pdf'], processor: 'pdfSecurityProcessor', launchState: 'live', indexable: true,
  },
  {
    id: 'repair-pdf', route: '/repair-pdf', name: 'Repair PDF',
    title: 'Repair PDF – Fix Damaged PDF Structure Online',
    description: 'Use QPDF recovery and structural rewriting to repair recoverable PDF file errors directly in your browser.',
    eyebrow: 'REPAIR PDF', primaryIntent: 'Repair recoverable structural errors in a PDF', kind: 'pdf', cluster: 'PDF', priority: 'P2', stage: 'PDF Expansion',
    secondaryKeywords: ['fix pdf', 'repair corrupted pdf', 'recover pdf', 'damaged pdf repair'], input: ['pdf'], output: ['pdf'], processor: 'pdfSecurityProcessor', launchState: 'live', indexable: true,
  },
];
