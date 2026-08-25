import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { PdfDocumentUtilityInterface, type PdfDocumentUtilityMode } from '@/components/PdfDocumentUtilityInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<PdfDocumentUtilityMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'crop-pdf': {
    details: [
      { title: 'Crop selected PDF pages', text: 'Apply top, right, bottom, and left margins to every page or only the page numbers you choose.' },
      { title: 'Millimetre controls', text: 'Enter crop margins in millimetres while the processor converts them to PDF points accurately.' },
      { title: 'Original stays unchanged', text: 'The tool creates a new PDF with updated crop boxes and never overwrites the selected source file.' },
    ],
    faq: [
      { question: 'Does cropping permanently delete hidden PDF content?', answer: 'No. This tool changes the PDF crop box that controls the visible page area. Content outside that box may still exist in the file.' },
      { question: 'Can I crop only some pages?', answer: 'Yes. Use all, individual page numbers such as 1,3,5, or a range such as 2-6.' },
      { question: 'What units are crop margins?', answer: 'The interface accepts millimetres and converts them to PDF points for processing.' },
    ],
  },
  'pdf-form-filler': {
    details: [
      { title: 'Detect interactive PDF fields', text: 'The tool reads AcroForm text fields, checkboxes, radio groups, dropdowns, and option lists directly from the selected PDF.' },
      { title: 'Fill supported fields in the browser', text: 'Enter values for detected controls and create a separate filled PDF without uploading it to an application server.' },
      { title: 'Optional flattening', text: 'Choose to flatten the fields after filling when you want the visible answers baked into the PDF instead of remaining editable.' },
    ],
    faq: [
      { question: 'Which PDF form fields can I fill?', answer: 'The current tool supports standard AcroForm text fields, checkboxes, radio groups, dropdowns, and option lists.' },
      { question: 'Does it support XFA forms?', answer: 'No. XFA-only forms are not supported by this browser-side AcroForm workflow.' },
      { question: 'Can I keep the fields editable?', answer: 'Yes. Leave “Flatten fields after filling” unchecked to preserve supported interactive fields in the output.' },
    ],
  },
  'flatten-pdf': {
    details: [
      { title: 'Bake form appearances into the PDF', text: 'Flatten converts the current visible form field appearances into regular page content.' },
      { title: 'Remove interactive controls', text: 'After flattening, the form fields are no longer editable controls in the output PDF.' },
      { title: 'Useful before sharing or archiving', text: 'Flatten a completed form when recipients should see the filled values without accidentally changing the fields.' },
    ],
    faq: [
      { question: 'What does flatten PDF mean?', answer: 'It removes interactive form controls while preserving their current visible appearances as page content.' },
      { question: 'Can I edit fields after flattening?', answer: 'Not as form controls. Keep your original PDF if you may need to edit the fields later.' },
      { question: 'Will this flatten comments and every annotation?', answer: 'No. This tool specifically flattens interactive AcroForm fields.' },
    ],
  },
};

export function PdfDocumentUtilityPage({ route, mode }: { route: string; mode: PdfDocumentUtilityMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown PDF document utility route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<PdfDocumentUtilityInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
