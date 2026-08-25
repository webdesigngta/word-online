export type CreatorMode =
  | 'resume-maker'
  | 'cover-letter-maker'
  | 'write-letter-online'
  | 'invoice-maker'
  | 'agenda-maker'
  | 'meeting-minutes-maker'
  | 'checklist-maker'
  | 'proposal-maker'
  | 'business-plan-maker'
  | 'memo-maker';

export type CreatorField = {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'textarea';
  rows?: number;
  defaultValue?: string;
};

export type CreatorDefinition = {
  mode: CreatorMode;
  name: string;
  intro: string;
  filename: string;
  fields: readonly CreatorField[];
};

export const creatorDefinitions: Record<CreatorMode, CreatorDefinition> = {
  'resume-maker': {
    mode: 'resume-maker', name: 'Resume Maker', intro: 'Build a clean professional resume and export it as DOCX, PDF, or TXT.', filename: 'resume',
    fields: [
      { id: 'fullName', label: 'Full name', placeholder: 'Jordan Lee', defaultValue: 'Jordan Lee' },
      { id: 'headline', label: 'Professional headline', placeholder: 'Operations Manager', defaultValue: 'Operations Manager' },
      { id: 'email', label: 'Email', type: 'email', placeholder: 'jordan@example.com', defaultValue: 'jordan@example.com' },
      { id: 'phone', label: 'Phone', placeholder: '+1 555 555 0100' },
      { id: 'location', label: 'Location', placeholder: 'Hamilton, ON' },
      { id: 'summary', label: 'Professional summary', type: 'textarea', rows: 4, placeholder: 'Summarize your experience, strengths, and goals.' },
      { id: 'skills', label: 'Skills', type: 'textarea', rows: 3, placeholder: 'Leadership\nOperations\nProject management' },
      { id: 'experience', label: 'Experience', type: 'textarea', rows: 7, placeholder: 'Company — Role — Dates\n• Achievement or responsibility\n\nCompany — Role — Dates\n• Achievement or responsibility' },
      { id: 'education', label: 'Education', type: 'textarea', rows: 4, placeholder: 'School — Credential — Year' },
    ],
  },
  'cover-letter-maker': {
    mode: 'cover-letter-maker', name: 'Cover Letter Maker', intro: 'Create a focused cover letter for a role and export a polished document.', filename: 'cover-letter',
    fields: [
      { id: 'fullName', label: 'Your name', defaultValue: 'Jordan Lee' },
      { id: 'contact', label: 'Contact line', placeholder: 'Hamilton, ON · jordan@example.com · 555-555-0100' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'recipient', label: 'Hiring manager', placeholder: 'Hiring Manager' },
      { id: 'company', label: 'Company', placeholder: 'Example Company' },
      { id: 'role', label: 'Role', placeholder: 'Operations Manager' },
      { id: 'opening', label: 'Opening paragraph', type: 'textarea', rows: 4, placeholder: 'Explain why you are applying and why this role fits.' },
      { id: 'body', label: 'Experience and value', type: 'textarea', rows: 7, placeholder: 'Connect your strongest experience and results to the employer’s needs.' },
      { id: 'closing', label: 'Closing paragraph', type: 'textarea', rows: 3, placeholder: 'Thank the reader and state your interest in discussing the role.' },
    ],
  },
  'write-letter-online': {
    mode: 'write-letter-online', name: 'Letter Writer Online', intro: 'Draft a formal or personal letter with a structured printable layout.', filename: 'letter',
    fields: [
      { id: 'sender', label: 'Sender details', type: 'textarea', rows: 3, placeholder: 'Your name\nAddress\nEmail / phone' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'recipient', label: 'Recipient details', type: 'textarea', rows: 3, placeholder: 'Recipient name\nCompany\nAddress' },
      { id: 'subject', label: 'Subject', placeholder: 'Subject of the letter' },
      { id: 'greeting', label: 'Greeting', placeholder: 'Dear …,' },
      { id: 'body', label: 'Letter body', type: 'textarea', rows: 10, placeholder: 'Write the main message. Separate paragraphs with a blank line.' },
      { id: 'closing', label: 'Closing', placeholder: 'Sincerely,' },
      { id: 'signature', label: 'Signature name', placeholder: 'Your name' },
    ],
  },
  'invoice-maker': {
    mode: 'invoice-maker', name: 'Invoice Maker', intro: 'Create an itemized invoice with automatic subtotal, tax, and total calculations.', filename: 'invoice',
    fields: [
      { id: 'businessName', label: 'Business name', defaultValue: 'Your Business' },
      { id: 'businessDetails', label: 'Business details', type: 'textarea', rows: 3, placeholder: 'Address\nEmail\nPhone' },
      { id: 'invoiceNumber', label: 'Invoice number', placeholder: 'INV-1001', defaultValue: 'INV-1001' },
      { id: 'date', label: 'Invoice date', type: 'date' },
      { id: 'dueDate', label: 'Due date', type: 'date' },
      { id: 'billTo', label: 'Bill to', type: 'textarea', rows: 3, placeholder: 'Client name\nCompany\nAddress' },
      { id: 'currency', label: 'Currency symbol', placeholder: '$', defaultValue: '$' },
      { id: 'items', label: 'Items — one per line: Description | Qty | Rate', type: 'textarea', rows: 7, placeholder: 'Website design | 1 | 1800\nHosting | 12 | 15', defaultValue: 'Service | 1 | 100' },
      { id: 'taxPercent', label: 'Tax %', type: 'number', placeholder: '13', defaultValue: '0' },
      { id: 'notes', label: 'Notes / payment terms', type: 'textarea', rows: 3, placeholder: 'Thank you for your business.' },
    ],
  },
  'agenda-maker': {
    mode: 'agenda-maker', name: 'Agenda Maker', intro: 'Plan a meeting with objectives, attendees, and timed agenda items.', filename: 'meeting-agenda',
    fields: [
      { id: 'title', label: 'Meeting title', defaultValue: 'Team Meeting' },
      { id: 'dateTime', label: 'Date and time', placeholder: 'August 25, 2026 · 10:00 AM' },
      { id: 'location', label: 'Location / link', placeholder: 'Conference Room A' },
      { id: 'facilitator', label: 'Facilitator', placeholder: 'Jordan Lee' },
      { id: 'attendees', label: 'Attendees', type: 'textarea', rows: 3, placeholder: 'Name 1\nName 2\nName 3' },
      { id: 'objectives', label: 'Meeting objectives', type: 'textarea', rows: 4, placeholder: 'What should this meeting accomplish?' },
      { id: 'items', label: 'Agenda — one per line: Time | Topic | Owner', type: 'textarea', rows: 7, placeholder: '10 min | Project update | Alex\n20 min | Decisions | Team' },
      { id: 'notes', label: 'Preparation / notes', type: 'textarea', rows: 3, placeholder: 'Documents to review before the meeting.' },
    ],
  },
  'meeting-minutes-maker': {
    mode: 'meeting-minutes-maker', name: 'Meeting Minutes Maker', intro: 'Turn meeting notes into structured minutes with decisions and action items.', filename: 'meeting-minutes',
    fields: [
      { id: 'title', label: 'Meeting title', defaultValue: 'Meeting Minutes' },
      { id: 'dateTime', label: 'Date and time', placeholder: 'August 25, 2026 · 10:00 AM' },
      { id: 'location', label: 'Location / link', placeholder: 'Conference Room A' },
      { id: 'facilitator', label: 'Facilitator', placeholder: 'Jordan Lee' },
      { id: 'attendees', label: 'Attendees', type: 'textarea', rows: 3, placeholder: 'Name 1\nName 2\nName 3' },
      { id: 'summary', label: 'Summary', type: 'textarea', rows: 4, placeholder: 'Brief overview of the meeting.' },
      { id: 'discussion', label: 'Discussion notes', type: 'textarea', rows: 7, placeholder: 'Key topics, context, and important comments.' },
      { id: 'decisions', label: 'Decisions', type: 'textarea', rows: 4, placeholder: 'One decision per line.' },
      { id: 'actions', label: 'Action items — one per line: Owner | Action | Due', type: 'textarea', rows: 6, placeholder: 'Alex | Send revised draft | Friday' },
    ],
  },
  'checklist-maker': {
    mode: 'checklist-maker', name: 'Checklist Maker', intro: 'Create a printable checklist from one item per line.', filename: 'checklist',
    fields: [
      { id: 'title', label: 'Checklist title', defaultValue: 'Project Checklist' },
      { id: 'purpose', label: 'Purpose / description', type: 'textarea', rows: 3, placeholder: 'Optional context for this checklist.' },
      { id: 'items', label: 'Checklist items — one per line', type: 'textarea', rows: 12, placeholder: 'Confirm requirements\nReview draft\nGet approval\nPublish' },
      { id: 'notes', label: 'Notes', type: 'textarea', rows: 4, placeholder: 'Optional notes or instructions.' },
    ],
  },
  'proposal-maker': {
    mode: 'proposal-maker', name: 'Proposal Maker', intro: 'Create a client-ready proposal with scope, deliverables, timeline, pricing, and next steps.', filename: 'proposal',
    fields: [
      { id: 'title', label: 'Proposal title', defaultValue: 'Project Proposal' },
      { id: 'client', label: 'Prepared for', placeholder: 'Client / company' },
      { id: 'preparedBy', label: 'Prepared by', placeholder: 'Your name / company' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'summary', label: 'Executive summary', type: 'textarea', rows: 5, placeholder: 'Summarize the client need and your proposed approach.' },
      { id: 'scope', label: 'Scope of work', type: 'textarea', rows: 7, placeholder: 'Describe what is included and what is not.' },
      { id: 'deliverables', label: 'Deliverables', type: 'textarea', rows: 5, placeholder: 'One deliverable per line.' },
      { id: 'timeline', label: 'Timeline', type: 'textarea', rows: 4, placeholder: 'Milestones, phases, or expected dates.' },
      { id: 'pricing', label: 'Pricing', type: 'textarea', rows: 4, placeholder: 'Fees, payment schedule, or estimate.' },
      { id: 'terms', label: 'Terms', type: 'textarea', rows: 4, placeholder: 'Assumptions, validity period, and key terms.' },
      { id: 'nextSteps', label: 'Next steps', type: 'textarea', rows: 3, placeholder: 'How the client can approve or proceed.' },
    ],
  },
  'business-plan-maker': {
    mode: 'business-plan-maker', name: 'Business Plan Maker', intro: 'Organize a practical business plan into standard sections and export it as a document.', filename: 'business-plan',
    fields: [
      { id: 'businessName', label: 'Business name', defaultValue: 'Business Name' },
      { id: 'preparedBy', label: 'Prepared by', placeholder: 'Founder / team' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'executiveSummary', label: 'Executive summary', type: 'textarea', rows: 5, placeholder: 'What the business does, target customer, and overall opportunity.' },
      { id: 'companyOverview', label: 'Company overview', type: 'textarea', rows: 5, placeholder: 'Mission, structure, location, and history.' },
      { id: 'marketAnalysis', label: 'Market analysis', type: 'textarea', rows: 6, placeholder: 'Customers, competitors, market size, and trends.' },
      { id: 'productsServices', label: 'Products / services', type: 'textarea', rows: 5, placeholder: 'What you sell and why customers choose it.' },
      { id: 'marketingSales', label: 'Marketing & sales', type: 'textarea', rows: 5, placeholder: 'How customers will discover, buy, and remain with the business.' },
      { id: 'operations', label: 'Operations', type: 'textarea', rows: 5, placeholder: 'People, suppliers, technology, facilities, and workflow.' },
      { id: 'management', label: 'Management & organization', type: 'textarea', rows: 4, placeholder: 'Key people, roles, and responsibilities.' },
      { id: 'financialPlan', label: 'Financial plan', type: 'textarea', rows: 6, placeholder: 'Revenue assumptions, costs, funding, runway, and financial goals.' },
      { id: 'milestones', label: 'Milestones', type: 'textarea', rows: 4, placeholder: 'One milestone per line.' },
    ],
  },
  'memo-maker': {
    mode: 'memo-maker', name: 'Memo Maker', intro: 'Create a concise professional memo with a clear subject, summary, and action section.', filename: 'memo',
    fields: [
      { id: 'to', label: 'To', placeholder: 'Team / recipient' },
      { id: 'from', label: 'From', placeholder: 'Your name' },
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'subject', label: 'Subject', defaultValue: 'Memo Subject' },
      { id: 'summary', label: 'Summary', type: 'textarea', rows: 4, placeholder: 'One-paragraph summary of the purpose and key message.' },
      { id: 'body', label: 'Memo body', type: 'textarea', rows: 9, placeholder: 'Add context, details, findings, or recommendations.' },
      { id: 'action', label: 'Action required', type: 'textarea', rows: 4, placeholder: 'State who should do what and by when.' },
    ],
  },
};

export const creatorModes = Object.keys(creatorDefinitions) as CreatorMode[];
