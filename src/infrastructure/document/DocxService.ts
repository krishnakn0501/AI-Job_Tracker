// src/infrastructure/document/DocxService.ts

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  LevelFormat,
} from "docx";
import fs from "fs";
import path from "path";
import { prisma } from "@/infrastructure/persistence/prisma/PrismaClient";

const NUMBERING = {
  config: [
    {
      reference: "bullets",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 720, hanging: 360 } },
          },
        },
      ],
    },
  ],
};

export async function generateDocx(
  claudeOutput: {
    summary: string;
    top_skills: string[];
    experience: Array<{
      company: string;
      role: string;
      duration: string;
      bullets: string[];
    }>;
    ats_keywords: string[];
  },
  applicationId: string
): Promise<string> {
  const rb = await prisma.resumeBase.findUnique({ where: { id: "singleton" } });
  const resume = (rb?.content ?? {}) as Record<string, string>;

  const sectionHeading = (text: string) =>
    new Paragraph({
      spacing: { before: 280, after: 80 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 4,
          color: "2E86AB",
          space: 4,
        },
      },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          font: "Arial",
          size: 20,
          bold: true,
          color: "2E86AB",
          allCaps: true,
          characterSpacing: 40,
        }),
      ],
    });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: resume.name ?? "Your Name",
          font: "Arial",
          size: 36,
          bold: true,
          color: "1E3A5F",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: [resume.email, resume.phone, resume.location]
            .filter(Boolean)
            .join("  ·  "),
          font: "Arial",
          size: 20,
          color: "64748B",
        }),
      ],
    }),
    sectionHeading("Professional Summary"),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: claudeOutput.summary,
          font: "Arial",
          size: 22,
          color: "1A1A2E",
        }),
      ],
    }),
    sectionHeading("Core Skills"),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: claudeOutput.top_skills.join("  ·  "),
          font: "Arial",
          size: 22,
          color: "1A1A2E",
        }),
      ],
    }),
    sectionHeading("Experience"),
    ...claudeOutput.experience.flatMap((exp) => [
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: exp.company,
            font: "Arial",
            size: 22,
            bold: true,
            color: "1E3A5F",
          }),
          new TextRun({
            text: `  ·  ${exp.role}  ·  ${exp.duration}`,
            font: "Arial",
            size: 22,
            color: "64748B",
          }),
        ],
      }),
      ...exp.bullets.map(
        (b) =>
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: b,
                font: "Arial",
                size: 21,
                color: "1A1A2E",
              }),
            ],
          })
      ),
    ]),
    sectionHeading("ATS Keywords"),
    new Paragraph({
      children: [
        new TextRun({
          text: claudeOutput.ats_keywords.join(", "),
          font: "Arial",
          size: 18,
          italics: true,
          color: "94A3B8",
        }),
      ],
    }),
  ];

  const doc = new Document({
    numbering: NUMBERING,
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

  const outDir = path.join(process.cwd(), "public", "resumes");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${applicationId}.docx`);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);

  return `/resumes/${applicationId}.docx`;
}
