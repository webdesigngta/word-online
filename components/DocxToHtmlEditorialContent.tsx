import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Sparkles,
} from 'lucide-react';
import { ToolVisual } from '@/components/ToolVisual';
import { relatedToolScore } from '@/lib/toolDesign';
import { allLivePlatformTools, getAllPlatformToolByRoute } from '@/tools/platform/allTools';
import styles from './DocxToHtmlEditorialContent.module.css';
import introStyles from './DocxToHtmlIntroSummary.module.css';

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

function ContentDocumentVisual() {
  return (
    <div className={styles.articlePaper} aria-hidden="true">
      <div className={styles.articleLines}><span/><span/><span/><span/><span/><span/></div>
    </div>
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

  const summaryItems = [
    'Free DOCX to HTML converter',
    'Simple online document conversion',
    'Upload your DOCX file and convert it to HTML',
  ];

  const workItems = [
    { title: 'Simple document tools', text: 'DOC321 keeps common document and file tasks focused on one clear job at a time.' },
    { title: 'Straightforward workflow', text: 'Choose the tool you need, add your file, complete the task, and move on without complicated software.' },
    { title: 'Made for everyday files', text: 'For DOCX to HTML conversion, upload your Word document and create an HTML version you can continue working with.' },
  ];

  return (
    <div className={styles.content}>
      <section className={introStyles.summaryStrip} aria-label="DOCX to HTML converter highlights">
        <p className={introStyles.summaryLead}>Convert DOCX to HTML online for free with DOC321. Upload a Word document and turn its content into HTML using a simple online converter.</p>
        <div className={introStyles.summaryList}>
          {summaryItems.map((item) => (
            <div className={introStyles.summaryItem} key={item}>
              <CheckCircle2 className={introStyles.summaryCheck} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.intro} ${introStyles.introCentered} ${introStyles.titleIntro}`} aria-labelledby="docx-html-intro-title">
        <h2 id="docx-html-intro-title">Free Online DOCX to HTML Converter</h2>
        <div className={`${styles.introBody} ${introStyles.titleIntroBody}`}>
          <p>Need to convert a Word document to HTML? Upload your DOCX file to DOC321 and generate an HTML version in a few simple steps, ready for your next web, editing, or document task.</p>
        </div>
      </section>

      <section className={styles.editorialRow} aria-labelledby="docx-html-convert-title">
        <div className={`${styles.sectionCopy} ${introStyles.editorialCopy}`}>
          <h2 id="docx-html-convert-title">Convert DOCX Files to HTML With DOC321</h2>
          <p>DOCX is made for word-processing, while HTML structures content for the web. DOC321 converts the content of your Word document into HTML so you can move it into a web-friendly format without rebuilding it by hand.</p>
        </div>
        <div className={`${styles.visual} ${introStyles.editorialVisual}`}>
          <span className={styles.spark}/><span className={styles.sparkAlt}/>
          <DocumentStackVisual />
        </div>
      </section>

      <section className={`${styles.editorialRow} ${styles.reverse}`} aria-labelledby="docx-html-content-title">
        <div className={`${styles.visual} ${styles.visualWarm} ${introStyles.editorialVisual}`}>
          <span className={styles.spark}/><span className={styles.sparkAlt}/>
          <ContentDocumentVisual />
        </div>
        <div className={`${styles.sectionCopy} ${introStyles.editorialCopy}`}>
          <h2 id="docx-html-content-title">Turn Document Content Into HTML</h2>
          <p>Already have the content written in Word? Convert the DOCX file to HTML and keep working from what you already created instead of starting over.</p>
          <div className={styles.subSection}>
            <h3>Why Convert DOCX to HTML?</h3>
            <p>DOCX is ideal for editable documents, while HTML is designed for structured digital content. Converting between them is useful when text from a Word file needs to move into an HTML workflow.</p>
          </div>
        </div>
      </section>

      <section className={styles.editorialRow} aria-labelledby="docx-html-existing-title">
        <div className={`${styles.sectionCopy} ${introStyles.editorialCopy}`}>
          <h2 id="docx-html-existing-title">Convert Existing Documents Instead of Recreating Them</h2>
          <p>When a DOCX file already contains the writing you need, converting it can save the extra work of manually recreating the same content as HTML.</p>
          <div className={styles.subSection}>
            <h3>Useful for Written Content</h3>
            <p>Use the converter for articles, reports, instructions, notes, guides, documentation, assignments, business documents, reference material, and written drafts that need an HTML version.</p>
          </div>
        </div>
        <div className={`${styles.visual} ${styles.visualMint} ${introStyles.editorialVisual}`}>
          <span className={styles.spark}/><span className={styles.sparkAlt}/>
          <ContentDocumentVisual />
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
          <p>Choose the DOCX to HTML converter, upload your document, run the conversion, and continue with the resulting HTML. DOC321 keeps the workflow easy to understand without adding unnecessary complexity.</p>
        </div>
        <div className={styles.workSection}>
          <h2>Work With Your Documents Using DOC321</h2>
          <div className={styles.workGrid}>
            {workItems.map((item) => (
              <article className={styles.workItem} key={item.title}>
                <span className={styles.workIcon}><Sparkles aria-hidden="true" /></span>
                <div className={introStyles.workCopy}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
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
