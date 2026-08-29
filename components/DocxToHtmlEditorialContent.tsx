import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Download,
  FileText,
  Layers3,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { ToolVisual } from '@/components/ToolVisual';
import { relatedToolScore } from '@/lib/toolDesign';
import { allLivePlatformTools, getAllPlatformToolByRoute } from '@/tools/platform/allTools';
import styles from './DocxToHtmlEditorialContent.module.css';

export const docxToHtmlFaq: Array<{ question: string; answer: string }> = [
  {
    question: 'How do I convert DOCX to HTML with DOC321?',
    answer: 'Upload your DOCX file into the DOCX to HTML converter at the top of the page and start the conversion. Once processing is complete, you can work with the resulting HTML.',
  },
  {
    question: "Is DOC321's DOCX to HTML converter free?",
    answer: "Yes. You can use DOC321's DOCX to HTML converter for free.",
  },
  {
    question: 'What is DOCX?',
    answer: 'DOCX is a document file format commonly associated with Microsoft Word and other word-processing software. It is commonly used for documents containing written content and formatting.',
  },
  {
    question: 'What is HTML?',
    answer: 'HTML stands for HyperText Markup Language. It is used to structure content using elements such as headings, paragraphs, lists, links, and other markup.',
  },
  {
    question: 'Why convert DOCX to HTML?',
    answer: 'You may want to convert DOCX to HTML when content currently stored in a Word document is needed in HTML format. Using a converter can reduce the amount of manual work involved in recreating the document content.',
  },
  {
    question: 'What types of DOCX files can I convert?',
    answer: 'The tool is intended for DOCX documents that you want to convert into HTML. Upload your file to the converter to begin the process.',
  },
  {
    question: 'Can I convert an existing document instead of rewriting it in HTML?',
    answer: 'Yes. That is the main purpose of the DOCX to HTML converter. Upload your existing DOCX document and use DOC321 to create an HTML version of its content.',
  },
  {
    question: 'Do I need to manually write HTML?',
    answer: 'The converter is designed to generate HTML from the DOCX file, reducing the need to manually recreate the document from the beginning.',
  },
  {
    question: 'Who might use a DOCX to HTML converter?',
    answer: 'A DOCX to HTML converter can be useful whenever someone has content stored in a DOCX document and needs that content converted into HTML format.',
  },
  {
    question: 'Why use DOC321 for DOCX to HTML conversion?',
    answer: 'DOC321 provides a dedicated DOCX to HTML tool with a straightforward workflow: upload your document, convert it, and work with the result.',
  },
];

export const docxToHtmlHowToSteps: Array<{ title: string; text: string }> = [
  {
    title: 'Upload your DOCX file',
    text: 'Upload or drag and drop your DOCX file into the DOCX to HTML converter.',
  },
  {
    title: 'Start the conversion',
    text: 'Start the conversion.',
  },
  {
    title: 'Review the converted HTML',
    text: 'Review the converted HTML.',
  },
  {
    title: 'Use the resulting HTML',
    text: 'Use the resulting HTML as needed.',
  },
];

function DocumentStackVisual() {
  return (
    <div className={styles.stack} aria-hidden="true">
      <div className={styles.paperBack} />
      <div className={styles.paper}>
        <div className={styles.lines}><span/><span/><span/><span/><span/></div>
      </div>
      <span className={`${styles.fileTag} ${styles.docxTag}`}>DOCX</span>
      <span className={`${styles.fileTag} ${styles.htmlTag}`}>HTML</span>
      <span className={styles.codeBadge}><Code2 /></span>
    </div>
  );
}

function ContentDocumentVisual({ withChips = false }: { withChips?: boolean }) {
  return (
    <>
      <div className={styles.articlePaper} aria-hidden="true">
        <div className={styles.articleLines}><span/><span/><span/><span/><span/><span/></div>
      </div>
      {withChips ? (
        <>
          <span className={`${styles.floatChip} ${styles.chipOne}`}><BookOpen />Articles</span>
          <span className={`${styles.floatChip} ${styles.chipTwo}`}><Layers3 />Reports</span>
          <span className={`${styles.floatChip} ${styles.chipThree}`}><FileText />Drafts</span>
        </>
      ) : null}
    </>
  );
}

function HowToVisual() {
  return (
    <div className={styles.howVisual} aria-hidden="true">
      <div className={styles.howPaper}>
        <div className={styles.lines}><span/><span/><span/><span/><span/></div>
      </div>
      <span className={styles.howDocx}>DOCX</span>
      <span className={styles.howHtml}>HTML</span>
    </div>
  );
}

export function DocxToHtmlEditorialContent() {
  const current = getAllPlatformToolByRoute('/docx-to-html');
  const relatedTools = current
    ? allLivePlatformTools
      .filter((item) => item.route !== current.route)
      .filter((item) => /docx|html|word/i.test(`${item.name} ${item.input.join(' ')} ${item.output.join(' ')}`))
      .sort((left, right) => relatedToolScore(current, right) - relatedToolScore(current, left) || left.name.localeCompare(right.name))
      .slice(0, 12)
    : [];

  const workItems = [
    { Icon: Sparkles, text: 'DOC321 provides online tools for common document and file tasks.' },
    { Icon: CheckCircle2, text: 'Each tool is focused on a specific job so you can choose what you need and complete the task without navigating through complicated software.' },
    { Icon: RefreshCw, text: 'For DOCX to HTML conversion, simply provide your DOCX file and use the converter to create an HTML version.' },
  ];

  return (
    <div className={styles.content}>
      <section className={styles.intro} aria-labelledby="docx-html-intro-title">
        <span className={styles.eyebrow}>Free DOCX to HTML converter</span>
        <h2 id="docx-html-intro-title">Free Online DOCX to HTML Converter</h2>
        <p className={styles.lead}>Convert DOCX to HTML online for free with DOC321. Upload a Word document and turn its content into HTML using a simple online converter.</p>
        <div className={styles.quickPoints} aria-label="DOCX to HTML converter highlights">
          <span>Free DOCX to HTML converter</span>
          <span>Simple online document conversion</span>
          <span>Upload your DOCX file and convert it to HTML</span>
        </div>
        <div className={styles.introBody}>
          <p>Need to convert a DOCX file to HTML?</p>
          <p>DOC321 provides a simple online DOCX to HTML converter that helps you turn content from a Word document into HTML.</p>
          <p>Upload your DOCX document, run the conversion, and use the resulting HTML for your next task.</p>
        </div>
      </section>

      <section className={styles.editorialRow} aria-labelledby="docx-html-convert-title">
        <div className={styles.sectionCopy}>
          <h2 id="docx-html-convert-title">Convert DOCX Files to HTML With DOC321</h2>
          <p>DOCX is a common format for creating and sharing documents, while HTML is commonly used to structure content for the web.</p>
          <p>DOC321 helps you convert between these formats without having to manually recreate the entire document as HTML.</p>
          <p>Upload your DOCX file and let the converter process its content into HTML.</p>
        </div>
        <div className={styles.visual}>
          <span className={styles.spark}/><span className={styles.sparkAlt}/>
          <DocumentStackVisual />
        </div>
      </section>

      <section className={`${styles.editorialRow} ${styles.reverse}`} aria-labelledby="docx-html-content-title">
        <div className={`${styles.visual} ${styles.visualWarm}`}>
          <span className={styles.spark}/><span className={styles.sparkAlt}/>
          <ContentDocumentVisual />
        </div>
        <div className={styles.sectionCopy}>
          <h2 id="docx-html-content-title">Turn Document Content Into HTML</h2>
          <p>If you already have text written inside a DOCX document, converting it to HTML can give you a useful starting point for working with that content in HTML format.</p>
          <p>Instead of manually creating HTML from the document, you can upload the file to DOC321 and generate an HTML version.</p>
          <div className={styles.subSection}>
            <h3>Why Convert DOCX to HTML?</h3>
            <p>DOCX and HTML are designed for different purposes.</p>
            <p>DOCX is commonly used for creating documents in word-processing applications.</p>
            <p>HTML is a markup language used to structure content.</p>
            <p>Converting DOCX to HTML can be useful when you need the contents of an existing document in HTML format.</p>
          </div>
        </div>
      </section>

      <section className={styles.editorialRow} aria-labelledby="docx-html-existing-title">
        <div className={styles.sectionCopy}>
          <h2 id="docx-html-existing-title">Convert Existing Documents Instead of Recreating Them</h2>
          <p>A DOCX document may already contain a large amount of written content.</p>
          <p>Recreating that content manually as HTML can take extra work.</p>
          <p>DOC321&apos;s DOCX to HTML converter provides a simpler way to create an HTML version from an existing DOCX file.</p>
          <div className={styles.subSection}>
            <h3>Useful for Written Content</h3>
            <p>You may have content stored in DOCX format such as:</p>
            <ul className={styles.contentList}>
              <li>Articles</li><li>Reports</li><li>Instructions</li><li>Notes</li><li>Guides</li><li>Documentation</li><li>Assignments</li><li>Business documents</li><li>Reference material</li><li>Written drafts</li>
            </ul>
            <p>DOC321 allows you to convert the DOCX file when you need that content in HTML format.</p>
          </div>
        </div>
        <div className={`${styles.visual} ${styles.visualMint}`}>
          <span className={styles.spark}/><span className={styles.sparkAlt}/>
          <ContentDocumentVisual withChips />
        </div>
      </section>

      <section className={styles.howPanel} aria-labelledby="docx-html-how-title">
        <div className={styles.howCopy}>
          <h2 id="docx-html-how-title">How to Convert DOCX to HTML With DOC321</h2>
          <ol className={styles.steps}>
            {docxToHtmlHowToSteps.map((step, index) => (
              <li className={styles.step} key={step.title}>
                <span className={styles.stepNum}>{index + 1}</span>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <p style={{ marginTop: 24 }}>DOC321 keeps the process focused on the task so you can convert your document without unnecessary steps.</p>
        </div>
        <HowToVisual />
      </section>

      <section className={styles.workflowSection} aria-labelledby="docx-html-workflow-title">
        <div className={styles.workflowIntro}>
          <h2 id="docx-html-workflow-title">A Simple DOCX to HTML Workflow</h2>
          <p>DOC321 is designed around straightforward document tools.</p>
          <p>Choose the DOCX to HTML converter, upload your document, run the conversion, and work with the resulting file or content.</p>
          <p>The goal is to keep common document tasks easy to understand without adding unnecessary complexity.</p>
        </div>
        <div className={styles.workSection}>
          <h2>Work With Your Documents Using DOC321</h2>
          <div className={styles.workGrid}>
            {workItems.map(({ Icon, text }) => (
              <article className={styles.workItem} key={text}>
                <span className={styles.workIcon}><Icon aria-hidden="true" /></span>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="docx-html-faq-title">
        <h2 id="docx-html-faq-title">FAQs About DOC321&apos;s DOCX to HTML Converter</h2>
        {docxToHtmlFaq.map((item) => (
          <article className={styles.faqRow} key={item.question}>
            <div className={styles.faqQuestion}>
              <span>{item.question}</span>
              <span className={styles.faqChevron} aria-hidden="true" />
            </div>
            <p className={styles.faqAnswer}>{item.answer}</p>
          </article>
        ))}
      </section>

      <section className={styles.cta} aria-label="Explore all DOC321 tools">
        <div>
          <h2>Keep working with DOC321</h2>
          <p>Finished converting your DOCX file? Open the full DOC321 tool library for your next document, PDF, image, spreadsheet, or writing task.</p>
        </div>
        <Link className={styles.ctaLink} href="/tools">View all tools <ArrowRight size={15} aria-hidden="true" /></Link>
      </section>

      {relatedTools.length ? (
        <section className={styles.relatedSection} aria-labelledby="docx-html-related-title">
          <div className={styles.relatedHead}>
            <div>
              <h2 id="docx-html-related-title">Related DOCX &amp; HTML tools</h2>
              <p>Quick links to nearby document workflows.</p>
            </div>
          </div>
          <div className={styles.relatedGrid}>
            {relatedTools.map((item) => (
              <Link className={styles.relatedLink} href={item.route} key={item.route}>
                <ToolVisual tool={item} size="sm" />
                <span className={styles.relatedName}>{item.name}</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
