import {
  documentRegistry,
  documentPipeline,
  documentService,
} from '../document-engine';
import {
  LocalDocumentStore,
  type DocumentStore,
} from '../document-engine/storage';
import {
  toolRegistry,
  type ToolRegistry,
} from '../tool-registry';
import {
  toolExecutor,
  ToolExecutor,
} from '../tool-execution';
import {
  registerWordEditorTool,
  wordEditorTool,
} from '../tool-registry/tools/wordEditorTool';
import type { Tool } from '../tool-registry/Tool';
import {
  registerWordToPdfProcessor,
  wordToPdfTool,
  docxViewerTool,
  registerDocxViewerProcessor,
  docxToHtmlTool,
  registerDocxToHtmlProcessor,
  htmlToDocxTool,
  registerHtmlToDocxProcessor,
  docxToTxtTool,
  registerDocxToTxtProcessor,
  txtToDocxTool,
  registerTxtToDocxProcessor,
  docxToRtfTool,
  registerDocxToRtfProcessor,
  rtfToDocxTool,
  registerRtfToDocxProcessor,
  docxToOdtTool,
  registerDocxToOdtProcessor,
  odtToDocxTool,
  registerOdtToDocxProcessor,
  wordDocumentInfoTool,
  registerWordDocumentInfoProcessor,
  docxMergeTool,
  registerDocxMergeProcessor,
  docxSplitTool,
  registerDocxSplitProcessor,
  docxCompressTool,
  registerDocxCompressProcessor,
  docxCompareTool,
  registerDocxCompareProcessor,
  docxExtractImagesTool,
  registerDocxExtractImagesProcessor,
  docxRemoveMetadataTool,
  registerDocxRemoveMetadataProcessor,
  wordStatisticsTool,
  registerWordStatisticsProcessor,
  docxRepairTool,
  registerDocxRepairProcessor,
} from '../../tools/word';
import {
  pdfCompressorTool,
  registerPdfCompressorProcessor,
  pdfMergeTool,
  registerPdfMergeProcessor,
  pdfSplitTool,
  registerPdfSplitProcessor,
  pdfToWordTool,
  registerPdfToWordProcessor,
  pdfEditorTool,
  registerPdfEditorProcessor,
  pdfOcrTool,
  registerPdfOcrProcessor,
} from '../../tools/pdf';
import {
  jpgToPdfProcessor,
  jpgToPdfTool,
  pngToPdfProcessor,
  pngToPdfTool,
  registerJpgToPdfProcessor,
  registerPngToPdfProcessor,
} from '../../tools/image';
import { excelToPdfTool, registerExcelToPdfProcessor } from '../../tools/spreadsheet';
import { htmlToPdfTool, registerHtmlToPdfProcessor } from '../../tools/html';

export interface Platform {
  documents: {
    registry: typeof documentRegistry;
    service: typeof documentService;
  };
  pipeline: typeof documentPipeline;
  storage: DocumentStore;
  tools: ToolRegistry;
  executor: ToolExecutor;
}

const availableTools: readonly Tool[] = [wordEditorTool, pdfCompressorTool, pdfMergeTool, pdfSplitTool, pdfToWordTool, pdfEditorTool, pdfOcrTool, wordToPdfTool, docxViewerTool, docxToHtmlTool, htmlToDocxTool, docxToTxtTool, txtToDocxTool, docxToRtfTool, rtfToDocxTool, docxToOdtTool, odtToDocxTool, wordDocumentInfoTool, docxMergeTool, docxSplitTool, docxCompressTool, docxCompareTool, docxExtractImagesTool, docxRemoveMetadataTool, wordStatisticsTool, docxRepairTool, jpgToPdfTool, pngToPdfTool, excelToPdfTool, htmlToPdfTool];
const documentStorage = new LocalDocumentStore();

export function initializePlatform(registry: ToolRegistry = toolRegistry): Platform {
  registerWordEditorTool(registry);
  availableTools
    .filter((tool) => tool.id !== wordEditorTool.id)
    .forEach((tool) => {
      if (!registry.get(tool.id)) registry.register(tool);
    });
  registerPdfCompressorProcessor(documentRegistry);
  registerPdfMergeProcessor(documentRegistry);
  registerPdfSplitProcessor(documentRegistry);
  registerPdfToWordProcessor(documentRegistry);
  registerPdfEditorProcessor(documentRegistry);
  registerPdfOcrProcessor(documentRegistry);
  registerWordToPdfProcessor(documentRegistry);
  registerDocxViewerProcessor(documentRegistry);
  registerDocxToHtmlProcessor(documentRegistry);
  registerHtmlToDocxProcessor(documentRegistry);
  registerDocxToTxtProcessor(documentRegistry);
  registerTxtToDocxProcessor(documentRegistry);
  registerDocxToRtfProcessor(documentRegistry);
  registerRtfToDocxProcessor(documentRegistry);
  registerDocxToOdtProcessor(documentRegistry);
  registerOdtToDocxProcessor(documentRegistry);
  registerWordDocumentInfoProcessor(documentRegistry);
  registerDocxMergeProcessor(documentRegistry);
  registerDocxSplitProcessor(documentRegistry);
  registerDocxCompressProcessor(documentRegistry);
  registerDocxCompareProcessor(documentRegistry);
  registerDocxExtractImagesProcessor(documentRegistry);
  registerDocxRemoveMetadataProcessor(documentRegistry);
  registerWordStatisticsProcessor(documentRegistry);
  registerDocxRepairProcessor(documentRegistry);
  registerJpgToPdfProcessor(documentRegistry);
  registerPngToPdfProcessor(documentRegistry);
  registerExcelToPdfProcessor(documentRegistry);
  registerHtmlToPdfProcessor(documentRegistry);

  return {
    documents: {
      registry: documentRegistry,
      service: documentService,
    },
    pipeline: documentPipeline,
    storage: documentStorage,
    tools: registry,
    executor: registry === toolRegistry ? toolExecutor : new ToolExecutor(registry),
  };
}