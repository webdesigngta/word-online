import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { ImageToWordInterface, type ImageToWordMode } from '@/components/ImageToWordInterface';
import { getAllPlatformToolByRoute } from '@/tools/platform/allTools';

const content: Record<ImageToWordMode, { details: Array<{ title: string; text: string }>; faq: Array<{ question: string; answer: string }> }> = {
  'image-to-word': {
    details: [
      { title: 'Recognize text from common images', text: 'Upload a JPG, JPEG, or PNG image and the OCR engine reads visible text directly in your browser.' },
      { title: 'Create an editable Word file', text: 'Recognized lines are written into a standard DOCX document that you can continue editing in Word-compatible software.' },
      { title: 'Review OCR confidence', text: 'The tool reports recognition confidence and warns when the source image may produce less reliable text.' },
    ],
    faq: [
      { question: 'Can I convert an image to Word?', answer: 'Yes. Upload a JPG, JPEG, or PNG containing readable text and the tool creates an editable DOCX file from OCR results.' },
      { question: 'Does image to Word preserve the exact layout?', answer: 'No. This tool prioritizes editable recognized text. Complex columns, graphics, and exact visual positioning may not be reproduced.' },
      { question: 'How can I improve OCR accuracy?', answer: 'Use a sharp, upright, high-resolution image with strong contrast and clearly visible text.' },
    ],
  },
  'jpg-to-word': {
    details: [
      { title: 'Built specifically for JPG and JPEG', text: 'The route accepts JPG/JPEG images and rejects unrelated formats before OCR processing starts.' },
      { title: 'OCR to editable DOCX', text: 'Visible text is recognized and written into a Word DOCX file rather than embedding the source image as a picture.' },
      { title: 'Keep the recognized text too', text: 'Along with DOCX, you can download or copy the plain recognized text for quick reuse.' },
    ],
    faq: [
      { question: 'How do I convert JPG to Word?', answer: 'Choose a JPG or JPEG image, run Convert to Word, then download the generated DOCX file.' },
      { question: 'Is the text editable after conversion?', answer: 'Yes. OCR-generated text is placed into an editable Word document.' },
      { question: 'Will handwriting convert correctly?', answer: 'Handwriting may be less accurate than clean printed text. Review the OCR confidence and proofread the generated document.' },
    ],
  },
  'png-to-word': {
    details: [
      { title: 'PNG-focused upload validation', text: 'This route accepts PNG images so the tool intent and file validation match the advertised format.' },
      { title: 'Convert screenshots and scans to text', text: 'PNG screenshots, scans, and exported images can be processed when they contain clear readable text.' },
      { title: 'Download DOCX or TXT', text: 'Use the editable Word document for formatting work or the TXT output for plain recognized content.' },
    ],
    faq: [
      { question: 'Can I convert PNG to Word online?', answer: 'Yes. Choose a PNG containing text and the browser OCR engine creates an editable DOCX.' },
      { question: 'Can this convert a screenshot to Word?', answer: 'Yes, if the screenshot is a PNG and contains clear readable text.' },
      { question: 'Does the source PNG get changed?', answer: 'No. The original image remains unchanged; the tool creates new DOCX and TXT outputs.' },
    ],
  },
};

export function ImageToWordPage({ route, mode }: { route: string; mode: ImageToWordMode }) {
  const tool = getAllPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown image-to-Word route: ${route}`);
  const page = content[mode];
  return <PlatformTaskPage route={route} title={tool.title} description={tool.description} tool={<ImageToWordInterface mode={mode} toolId={tool.id} />} details={page.details} faq={page.faq} />;
}
