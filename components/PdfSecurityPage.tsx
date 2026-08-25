import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfSecurityInterface } from '@/components/PdfSecurityInterface';
import type { PdfSecurityMode } from '@/tools/pdf/security';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfSecurityMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  protect: {
    details: [
      { title: '256-bit PDF encryption', text: 'Protect the new PDF copy with modern 256-bit encryption using QPDF in the browser.' },
      { title: 'One password to open', text: 'Choose the password readers must enter before opening the protected PDF.' },
      { title: 'Original file stays unchanged', text: 'The source PDF is never overwritten; the tool creates a separate protected copy.' },
    ],
    faq: [
      { question: 'How do I password protect a PDF?', answer: 'Choose the PDF, enter and confirm an open password, then create and download the protected copy.' },
      { question: 'What encryption does this use?', answer: 'The current tool requests 256-bit PDF encryption from QPDF.' },
      { question: 'Can you recover my password later?', answer: 'No. Keep your password somewhere safe. The tool does not provide password recovery.' },
    ],
  },
  unlock: {
    details: [
      { title: 'Unlock with a known password', text: 'Enter a valid password for the PDF and create a new copy without password encryption.' },
      { title: 'No password bypass', text: 'The tool is designed for files you are authorized to access and requires the PDF password.' },
      { title: 'Browser-side decryption', text: 'QPDF processes the selected file in the browser and creates a separate unlocked PDF.' },
    ],
    faq: [
      { question: 'Can I remove a PDF password?', answer: 'Yes, when you know a valid password for the PDF. Choose the file, enter the password, and create the unlocked copy.' },
      { question: 'Can this crack an unknown PDF password?', answer: 'No. This tool requires a valid password and is not a password-cracking service.' },
      { question: 'Does unlocking modify my original file?', answer: 'No. It creates a new PDF without password encryption.' },
    ],
  },
  repair: {
    details: [
      { title: 'Rewrite damaged PDF structure', text: 'QPDF reads the source with recovery enabled and rewrites the document structure when recovery is possible.' },
      { title: 'Useful for structural PDF errors', text: 'This can help with malformed cross-reference data and similar structural issues, but it cannot reconstruct missing content.' },
      { title: 'Warnings are preserved', text: 'If QPDF recovers the document with warnings, the tool tells you to review the repaired output.' },
    ],
    faq: [
      { question: 'Can this repair every corrupted PDF?', answer: 'No. It can repair some structural PDF problems that QPDF can recover from, but severely damaged or incomplete files may still fail.' },
      { question: 'Will repair change the visible document?', answer: 'The goal is to preserve document content while rewriting PDF structure, but you should review recovered files before relying on them.' },
      { question: 'Can it repair a password-protected PDF?', answer: 'Protected files may need to be unlocked first if QPDF cannot read them without a password.' },
    ],
  },
};

export function PdfSecurityPage({ route, mode }: { route: string; mode: PdfSecurityMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown PDF security route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PdfSecurityInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
