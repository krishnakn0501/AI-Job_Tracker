import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import { marked } from "marked";
import fs from "fs";
import path from "path";

type RenderMode = "review" | "final";

const HIGHLIGHT_REGEX = /==(.+?)==/g;

/**
 * Splits a line of text into segments, marking which parts were inside ==..==.
 * Returns an array of { text, highlighted } in original order.
 */
function splitHighlights(
  text: string
): Array<{ text: string; highlighted: boolean }> {
  const segments: Array<{ text: string; highlighted: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  HIGHLIGHT_REGEX.lastIndex = 0;

  while ((match = HIGHLIGHT_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        highlighted: false,
      });
    }
    segments.push({ text: match[1], highlighted: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlighted: false });
  }
  return segments.length > 0 ? segments : [{ text, highlighted: false }];
}

/**
 * Builds TextRuns for one line, applying yellow highlight only in "review" mode.
 */
function buildRuns(
  text: string,
  mode: RenderMode,
  opts: { bold?: boolean; size?: number; color?: string } = {}
): TextRun[] {
  const segments = splitHighlights(text);
  return segments.map(
    (seg) =>
      new TextRun({
        text: seg.text,
        font: "Arial",
        size: opts.size ?? 22,
        bold: opts.bold ?? false,
        color: opts.color ?? "1A1A2E",
        highlight:
          mode === "review" && seg.highlighted ? "yellow" : undefined,
      })
  );
}

/**
 * Converts one Markdown document (resume OR cover letter) into a docx Document.
 * mode="review" keeps ==highlight== spans visually highlighted yellow.
 * mode="final" strips the == markers and renders plain text, no highlight.
 */
export function markdownToDocx(markdown: string, mode: RenderMode): Document {
  const tokens = marked.lexer(markdown);
  const children: Paragraph[] = [];

  for (const token of tokens) {
    if (token.type === "heading") {
      const headingSizeByLevel: Record<number, number> = {
        1: 36,
        2: 24,
        3: 22,
      };
      children.push(
        new Paragraph({
          spacing: { before: token.depth === 1 ? 0 : 240, after: 100 },
          border:
            token.depth === 2
              ? {
                  bottom: {
                    style: "single",
                    size: 4,
                    color: "2E86AB",
                    space: 4,
                  },
                }
              : undefined,
          alignment:
            token.depth === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: buildRuns(token.text, mode, {
            bold: true,
            size: headingSizeByLevel[token.depth] ?? 22,
            color: token.depth === 1 ? "1E3A5F" : "2E86AB",
          }),
        })
      );
    } else if (token.type === "list") {
      for (const item of token.items) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { before: 40, after: 60 },
            children: buildRuns(item.text, mode, { size: 21 }),
          })
        );
      }
    } else if (token.type === "paragraph") {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 100 },
          children: buildRuns(token.text, mode, { size: 22 }),
        })
      );
    } else if (token.type === "space") {
      continue;
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1008, right: 1008, bottom: 1008, left: 1008 },
          },
        },
        children,
      },
    ],
  });
}

/**
 * Writes a docx Document to disk.
 * Creates parent directories if they don't exist.
 */
export async function saveDocx(doc: Document, outPath: string): Promise<void> {
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
}
