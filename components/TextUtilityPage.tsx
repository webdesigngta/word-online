import { PlatformTaskPage } from '@/components/PlatformTaskPage';
import { TextUtilityInterface, type TextUtilityMode } from '@/components/TextUtilityInterface';
import { getPlatformToolByRoute } from '@/tools/platform/catalog';

const pageContent: Record<TextUtilityMode, {
  details: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
}> = {
  notepad: {
    details: [
      { title: 'Start instantly', text: 'Open the page and begin writing without creating an account or uploading a file.' },
      { title: 'Autosave locally', text: 'Notes are saved in local browser storage so the text can survive a refresh on the same browser.' },
      { title: 'Copy or download', text: 'Copy the finished note or download it as a plain TXT file whenever you are ready.' },
    ],
    faq: [
      { question: 'Does the online notepad autosave?', answer: 'Yes. The note is saved in local browser storage on the same device and browser.' },
      { question: 'Is my note uploaded to a server?', answer: 'The notepad is designed to work in the browser and stores its autosave copy locally rather than in a user account.' },
      { question: 'Can I download the note?', answer: 'Yes. Use Download TXT to save the current note as a plain-text file.' },
    ],
  },
  'character-count': {
    details: [
      { title: 'Instant character count', text: 'Characters update as you type, including a separate count that excludes whitespace.' },
      { title: 'More text statistics', text: 'See words, lines, and paragraph counts in the same workspace.' },
      { title: 'Browser-based', text: 'The text analysis runs directly in the page with no document upload required.' },
    ],
    faq: [
      { question: 'Does Character Count include spaces?', answer: 'The tool shows both total characters and characters with whitespace removed.' },
      { question: 'Does it count words too?', answer: 'Yes. Word, line, and paragraph counts are included alongside character totals.' },
      { question: 'Do I need to upload a document?', answer: 'No. Paste or type text directly into the browser workspace.' },
    ],
  },
  'change-case': {
    details: [
      { title: 'Four common case styles', text: 'Convert text to uppercase, lowercase, title case, or sentence case with one click.' },
      { title: 'Keep editing', text: 'The transformed result remains in the editor so you can make additional changes immediately.' },
      { title: 'Copy the result', text: 'Copy the converted text back to your document, email, CMS, or other workspace.' },
    ],
    faq: [
      { question: 'What text case options are available?', answer: 'The tool includes uppercase, lowercase, title case, and sentence case.' },
      { question: 'Does it change my original file?', answer: 'No file is modified. The tool only transforms the text in the browser workspace.' },
      { question: 'Can I copy the converted text?', answer: 'Yes. Use the Copy button after applying the case style you want.' },
    ],
  },
  'find-replace': {
    details: [
      { title: 'Literal matching', text: 'Enter the exact word or phrase to find without needing regular-expression syntax.' },
      { title: 'Replace first or all', text: 'Choose whether to change the first occurrence or every matching occurrence.' },
      { title: 'See match count', text: 'The Replace all button displays how many literal matches are currently present.' },
    ],
    faq: [
      { question: 'Can I replace every occurrence of a word?', answer: 'Yes. Enter the find text and replacement text, then choose Replace all.' },
      { question: 'Is the search case-sensitive?', answer: 'Yes. Literal matching currently treats uppercase and lowercase text as different.' },
      { question: 'Does Find and Replace upload my text?', answer: 'The replacement operation runs in the browser workspace.' },
    ],
  },
  'remove-formatting': {
    details: [
      { title: 'Plain-text paste', text: 'Pasting into the workspace keeps text while dropping rich formatting such as fonts, colors, and links.' },
      { title: 'Check the cleaned text', text: 'Review the plain-text result before copying or downloading it.' },
      { title: 'Export as TXT', text: 'Download the cleaned content as a standard UTF-8 text file.' },
    ],
    faq: [
      { question: 'What formatting does this remove?', answer: 'The plain-text workspace removes rich text presentation such as fonts, colors, bold styling, and embedded link formatting.' },
      { question: 'Will the words stay intact?', answer: 'The browser keeps the textual content that is pasted into the textarea while dropping rich styling.' },
      { question: 'Can I download the cleaned text?', answer: 'Yes. Use Download TXT after reviewing the result.' },
    ],
  },
  'remove-duplicate-lines': {
    details: [
      { title: 'Preserve first occurrence', text: 'The first copy of each exact line is kept and later duplicate lines are removed.' },
      { title: 'Keep original order', text: 'Remaining lines stay in the same order as their first appearance.' },
      { title: 'Copy when finished', text: 'Copy the deduplicated text directly back to your working document.' },
    ],
    faq: [
      { question: 'Does it preserve line order?', answer: 'Yes. The first occurrence remains in its original position and later exact duplicates are removed.' },
      { question: 'Is duplicate matching case-sensitive?', answer: 'Yes. Lines with different capitalization are treated as different lines.' },
      { question: 'Can I use this for lists?', answer: 'Yes. It is useful for plain-text lists with one item per line.' },
    ],
  },
  'sort-text': {
    details: [
      { title: 'Sort A–Z', text: 'Alphabetize lines in ascending order using browser locale-aware sorting.' },
      { title: 'Sort Z–A', text: 'Reverse the order with the descending sort option.' },
      { title: 'Numeric-aware', text: 'The browser sort is configured to handle numbers inside text more naturally.' },
    ],
    faq: [
      { question: 'Can I sort text alphabetically?', answer: 'Yes. Use Sort A–Z for ascending order or Sort Z–A for descending order.' },
      { question: 'Does it sort one line at a time?', answer: 'Yes. Each line is treated as one sortable item.' },
      { question: 'Can I copy the sorted result?', answer: 'Yes. The result remains editable and can be copied with one click.' },
    ],
  },
};

export function TextUtilityPage({
  route,
  mode,
}: {
  route: string;
  mode: TextUtilityMode;
}) {
  const tool = getPlatformToolByRoute(route);
  if (!tool) throw new Error(`Unknown platform tool route: ${route}`);
  const content = pageContent[mode];

  return (
    <PlatformTaskPage
      route={route}
      title={tool.title}
      description={tool.description}
      tool={<TextUtilityInterface mode={mode} toolId={tool.id} />}
      details={content.details}
      faq={content.faq}
    />
  );
}
