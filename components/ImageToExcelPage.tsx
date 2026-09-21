import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { ImageToExcelInterface } from '@/components/ImageToExcelInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const details = [
  {
    title: 'Detect rows and columns from a picture',
    text: 'OCR reads the visible table text while geometry-aware grouping uses the position of each recognized word to rebuild rows and columns.',
  },
  {
    title: 'Fix the table before downloading',
    text: 'Review every detected cell in an editable grid. Correct OCR mistakes, add rows or columns, and remove empty edges before export.',
  },
  {
    title: 'Download real XLSX or CSV files',
    text: 'Export the cleaned table as an Excel XLSX workbook or a CSV file instead of copying OCR text into a spreadsheet by hand.',
  },
];

const faq = [
  {
    question: 'How do I convert an image to Excel?',
    answer: 'Upload or paste a JPG, PNG, or WEBP image containing a table, run table detection, review the editable cells, then download the result as XLSX or CSV.',
  },
  {
    question: 'Can I convert a screenshot to Excel?',
    answer: 'Yes. You can paste an image screenshot with Ctrl+V or upload the screenshot file, then DOC321 detects the visible rows and columns.',
  },
  {
    question: 'Does Image to Excel work with photos of tables?',
    answer: 'Yes, but sharp and straight photos with good lighting and readable text work best. Perspective distortion, blur, handwriting, or very dense tables may need manual cell corrections.',
  },
  {
    question: 'Can I edit the detected data before downloading?',
    answer: 'Yes. The extracted table appears in an editable grid so you can correct cells and add rows or columns before creating the XLSX or CSV file.',
  },
  {
    question: 'Is the generated Excel file a real XLSX workbook?',
    answer: 'Yes. DOC321 creates a standard XLSX workbook from the reviewed table data. It is not a renamed image or text file.',
  },
];

export function ImageToExcelPage({ route = '/image-to-excel' }: { route?: string }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error('Unknown Image to Excel route: ' + route);

  return (
    <PlatformTaskPage
      route={route}
      title={tool.title}
      description={tool.description}
      tool={<ImageToExcelInterface toolId={tool.id} />}
      details={details}
      faq={faq}
      customHowToSteps={[
        { title: 'Add a table image', text: 'Upload a JPG, PNG, or WEBP file, drag it into the tool, or paste a screenshot with Ctrl+V.' },
        { title: 'Detect the table', text: 'Run OCR and table detection to turn positioned image text into rows and columns.' },
        { title: 'Review and edit the cells', text: 'Correct any OCR mistakes directly in the spreadsheet-style preview before export.' },
        { title: 'Download Excel or CSV', text: 'Save the reviewed data as a real XLSX workbook or CSV file.' },
      ]}
    />
  );
}
