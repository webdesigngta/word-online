import type { CreatorMode } from './creatorDefinitions';

export type CreatorValues = Record<string, string>;

function esc(value = '') {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function paragraphs(value = '') {
  return value.trim()
    ? value.trim().split(/\n\s*\n/).map((part) => `<p>${esc(part).replace(/\n/g, '<br>')}</p>`).join('')
    : '';
}

function lines(value = '') {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function bullets(value = '') {
  const items = lines(value);
  return items.length ? `<ul>${items.map((item) => `<li>${esc(item.replace(/^[-•]\s*/, ''))}</li>`).join('')}</ul>` : '';
}

function section(title: string, body: string) {
  return body ? `<section><h2>${esc(title)}</h2>${body}</section>` : '';
}

function rows(value = '') {
  return lines(value).map((line) => line.split('|').map((cell) => cell.trim()));
}

function money(value: number, symbol: string) {
  return `${symbol}${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`;
}

export function buildCreatorHtml(mode: CreatorMode, v: CreatorValues) {
  if (mode === 'resume-maker') {
    return `<article><header><h1>${esc(v.fullName)}</h1><h3>${esc(v.headline)}</h3><div class="meta">${[v.email, v.phone, v.location].filter(Boolean).map(esc).join(' · ')}</div></header>${section('Professional Summary', paragraphs(v.summary))}${section('Skills', bullets(v.skills))}${section('Experience', paragraphs(v.experience))}${section('Education', paragraphs(v.education))}</article>`;
  }
  if (mode === 'cover-letter-maker') {
    return `<article><header><h1>${esc(v.fullName)}</h1><div class="meta">${esc(v.contact)}</div></header><p>${esc(v.date)}</p><p>${esc(v.recipient)}${v.company ? `<br>${esc(v.company)}` : ''}</p><p><strong>Re: ${esc(v.role)}</strong></p><p>Dear ${esc(v.recipient || 'Hiring Manager')},</p>${paragraphs(v.opening)}${paragraphs(v.body)}${paragraphs(v.closing)}<p>Sincerely,<br>${esc(v.fullName)}</p></article>`;
  }
  if (mode === 'write-letter-online') {
    return `<article>${paragraphs(v.sender)}<p>${esc(v.date)}</p>${paragraphs(v.recipient)}${v.subject ? `<p><strong>Subject: ${esc(v.subject)}</strong></p>` : ''}<p>${esc(v.greeting)}</p>${paragraphs(v.body)}<p>${esc(v.closing)}<br>${esc(v.signature)}</p></article>`;
  }
  if (mode === 'invoice-maker') {
    const symbol = v.currency || '$';
    const items = rows(v.items).map((row) => ({ description: row[0] || '', quantity: Number(row[1] || 1), rate: Number(row[2] || 0) }));
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = subtotal * (Number(v.taxPercent || 0) / 100);
    return `<article><header><h1>${esc(v.businessName || 'Invoice')}</h1><div class="meta">${esc(v.businessDetails).replace(/\n/g, '<br>')}</div></header><p><strong>Invoice:</strong> ${esc(v.invoiceNumber)}<br><strong>Date:</strong> ${esc(v.date)}<br><strong>Due:</strong> ${esc(v.dueDate)}</p><p><strong>Bill to</strong><br>${esc(v.billTo).replace(/\n/g, '<br>')}</p><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${items.map((item) => `<tr><td>${esc(item.description)}</td><td>${item.quantity}</td><td>${money(item.rate, symbol)}</td><td>${money(item.quantity * item.rate, symbol)}</td></tr>`).join('')}</tbody></table><div class="totals"><p>Subtotal: <strong>${money(subtotal, symbol)}</strong></p><p>Tax (${esc(v.taxPercent || '0')}%): <strong>${money(tax, symbol)}</strong></p><p>Total: <strong>${money(subtotal + tax, symbol)}</strong></p></div>${section('Notes', paragraphs(v.notes))}</article>`;
  }
  if (mode === 'agenda-maker') {
    const items = rows(v.items);
    return `<article><header><h1>${esc(v.title)}</h1><div class="meta">${[v.dateTime, v.location, v.facilitator].filter(Boolean).map(esc).join(' · ')}</div></header>${section('Attendees', bullets(v.attendees))}${section('Objectives', paragraphs(v.objectives))}${items.length ? `<section><h2>Agenda</h2><table><thead><tr><th>Time</th><th>Topic</th><th>Owner</th></tr></thead><tbody>${items.map((row) => `<tr><td>${esc(row[0] || '')}</td><td>${esc(row[1] || '')}</td><td>${esc(row[2] || '')}</td></tr>`).join('')}</tbody></table></section>` : ''}${section('Preparation / Notes', paragraphs(v.notes))}</article>`;
  }
  if (mode === 'meeting-minutes-maker') {
    const actions = rows(v.actions);
    return `<article><header><h1>${esc(v.title)}</h1><div class="meta">${[v.dateTime, v.location, v.facilitator].filter(Boolean).map(esc).join(' · ')}</div></header>${section('Attendees', bullets(v.attendees))}${section('Summary', paragraphs(v.summary))}${section('Discussion', paragraphs(v.discussion))}${section('Decisions', bullets(v.decisions))}${actions.length ? `<section><h2>Action Items</h2><table><thead><tr><th>Owner</th><th>Action</th><th>Due</th></tr></thead><tbody>${actions.map((row) => `<tr><td>${esc(row[0] || '')}</td><td>${esc(row[1] || '')}</td><td>${esc(row[2] || '')}</td></tr>`).join('')}</tbody></table></section>` : ''}</article>`;
  }
  if (mode === 'checklist-maker') {
    return `<article><header><h1>${esc(v.title)}</h1></header>${paragraphs(v.purpose)}<ul class="checklist">${lines(v.items).map((item) => `<li>☐ ${esc(item)}</li>`).join('')}</ul>${section('Notes', paragraphs(v.notes))}</article>`;
  }
  if (mode === 'proposal-maker') {
    return `<article><header><h1>${esc(v.title)}</h1><div class="meta">Prepared for ${esc(v.client)} · Prepared by ${esc(v.preparedBy)} · ${esc(v.date)}</div></header>${section('Executive Summary', paragraphs(v.summary))}${section('Scope of Work', paragraphs(v.scope))}${section('Deliverables', bullets(v.deliverables))}${section('Timeline', paragraphs(v.timeline))}${section('Pricing', paragraphs(v.pricing))}${section('Terms', paragraphs(v.terms))}${section('Next Steps', paragraphs(v.nextSteps))}</article>`;
  }
  if (mode === 'business-plan-maker') {
    return `<article><header><h1>${esc(v.businessName)}</h1><div class="meta">Business Plan · ${esc(v.preparedBy)} · ${esc(v.date)}</div></header>${section('Executive Summary', paragraphs(v.executiveSummary))}${section('Company Overview', paragraphs(v.companyOverview))}${section('Market Analysis', paragraphs(v.marketAnalysis))}${section('Products & Services', paragraphs(v.productsServices))}${section('Marketing & Sales', paragraphs(v.marketingSales))}${section('Operations', paragraphs(v.operations))}${section('Management & Organization', paragraphs(v.management))}${section('Financial Plan', paragraphs(v.financialPlan))}${section('Milestones', bullets(v.milestones))}</article>`;
  }
  return `<article><header><h1>MEMORANDUM</h1></header><table><tbody><tr><th>To</th><td>${esc(v.to)}</td></tr><tr><th>From</th><td>${esc(v.from)}</td></tr><tr><th>Date</th><td>${esc(v.date)}</td></tr><tr><th>Subject</th><td>${esc(v.subject)}</td></tr></tbody></table>${section('Summary', paragraphs(v.summary))}${section('Details', paragraphs(v.body))}${section('Action Required', paragraphs(v.action))}</article>`;
}
