import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { OfficeConversionInterface, type OfficeConversionMode } from '@/components/OfficeConversionInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<OfficeConversionMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'pdf-to-excel': {
    details: [
      { title: 'Position-aware text extraction', text: 'The converter uses PDF text coordinates to group nearby content into rows and cells, with one Excel worksheet per PDF page.' },
      { title: 'Best for text PDFs', text: 'Digitally generated PDFs with clear tables work best. Scanned pages should be OCR processed first, and complex merged tables can require cleanup.' },
      { title: 'Real XLSX workbook', text: 'The output is an actual XLSX file generated in your browser, not a renamed CSV or text file.' },
    ],
    faq: [
      { question: 'Can I convert PDF to Excel online?', answer: 'Yes. The tool extracts positioned text from each PDF page and creates an XLSX workbook with one worksheet per page.' },
      { question: 'Will every PDF table convert perfectly?', answer: 'No. PDF files do not store tables like spreadsheets. Complex layouts, merged cells, and unusual spacing can require manual cleanup after conversion.' },
      { question: 'Does it work with scanned PDFs?', answer: 'Scanned image-only PDFs do not contain normal extractable text. Run OCR first for better results.' },
    ],
  },
  'pdf-to-ppt': {
    details: [
      { title: 'One page per slide', text: 'Every PDF page is rendered at high resolution and placed on its own 16:9 PowerPoint slide.' },
      { title: 'Visual preservation', text: 'Because each page becomes a slide image, the original PDF appearance is preserved more reliably than a rough text reconstruction.' },
      { title: 'Simple PPTX output', text: 'The resulting file is a real PPTX presentation. PDF text remains part of the page image rather than becoming separate editable PowerPoint objects.' },
    ],
    faq: [
      { question: 'Can I convert a PDF to PowerPoint?', answer: 'Yes. The converter creates one PowerPoint slide for each PDF page.' },
      { question: 'Will PDF text be editable in PowerPoint?', answer: 'No. The current converter preserves each PDF page visually as an image on the slide.' },
      { question: 'Does it upload my PDF to a server?', answer: 'No. PDF rendering and PPTX generation happen in your browser.' },
    ],
  },
  'epub-to-pdf': {
    details: [
      { title: 'Reads the EPUB spine', text: 'The converter opens the EPUB package, follows its declared reading order, and combines readable chapters for PDF rendering.' },
      { title: 'Embedded image support', text: 'Common local chapter images are embedded into the browser-rendered document before the PDF is created.' },
      { title: 'Reflowable-book focus', text: 'The current tool is intended for standard unencrypted EPUB books. DRM, fixed-layout EPUBs, scripts, remote resources, and advanced ebook styling are not reproduced exactly.' },
    ],
    faq: [
      { question: 'Can I convert EPUB to PDF online?', answer: 'Yes. Standard reflowable EPUB files can be unpacked and rendered into a paginated PDF in the browser.' },
      { question: 'Does EPUB to PDF support DRM-protected ebooks?', answer: 'No. The tool does not bypass DRM or access controls.' },
      { question: 'Will the PDF look exactly like my ebook reader?', answer: 'Not always. EPUB is a reflowable format, so fonts, pagination, and advanced CSS can differ when converted to fixed PDF pages.' },
    ],
  },
};

export function OfficeConversionPage({ route, mode }: { route: string; mode: OfficeConversionMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown office conversion route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<OfficeConversionInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
