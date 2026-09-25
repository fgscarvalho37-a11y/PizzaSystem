function ascii(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/–|—/g, "-")
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(
  value: string
) {
  return ascii(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(
  value: string,
  maxChars = 88
) {
  const text =
    ascii(value).trim();

  if (!text) {
    return [""];
  }

  const words =
    text.split(/\s+/);

  const lines:
    string[] = [];

  let current = "";

  for (const word of words) {
    const candidate =
      current
        ? `${current} ${word}`
        : word;

    if (
      candidate.length <=
      maxChars
    ) {
      current =
        candidate;

      continue;
    }

    if (current) {
      lines.push(
        current
      );
    }

    current = word;
  }

  if (current) {
    lines.push(
      current
    );
  }

  return lines;
}

export function downloadSimplePdf(
  fileName: string,
  title: string,
  lines: string[]
) {
  const allLines = [
    title,
    "",
    ...lines.flatMap(
      (line) =>
        wrapLine(line)
    ),
  ];

  const linesPerPage =
    48;

  const pages:
    string[][] = [];

  for (
    let index = 0;
    index < allLines.length;
    index += linesPerPage
  ) {
    pages.push(
      allLines.slice(
        index,
        index + linesPerPage
      )
    );
  }

  if (pages.length === 0) {
    pages.push(
      [title]
    );
  }

  const objects:
    string[] = [];

  const pageIds =
    pages.map(
      (_, index) =>
        4 + index * 2
    );

  objects[1] =
    "<< /Type /Catalog /Pages 2 0 R >>";

  objects[2] =
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds
      .map(
        (id) =>
          `${id} 0 R`
      )
      .join(" ")}] >>`;

  objects[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";

  pages.forEach(
    (
      pageLines,
      index
    ) => {
      const pageId =
        4 + index * 2;

      const contentId =
        pageId + 1;

      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;

      const contentLines:
        string[] = [
          "BT",
          "/F1 10 Tf",
          "40 800 Td",
          "14 TL",
        ];

      pageLines.forEach(
        (
          line,
          lineIndex
        ) => {
          if (
            lineIndex === 0 &&
            index === 0
          ) {
            contentLines.push(
              "/F1 15 Tf"
            );
          } else if (
            lineIndex === 1 &&
            index === 0
          ) {
            contentLines.push(
              "/F1 10 Tf"
            );
          }

          contentLines.push(
            `(${escapePdfText(
              line
            )}) Tj`,
            "T*"
          );
        }
      );

      contentLines.push(
        "ET"
      );

      const stream =
        contentLines.join(
          "\n"
        );

      objects[contentId] =
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }
  );

  let pdf =
    "%PDF-1.4\n%1234\n";

  const offsets:
    number[] = [
      0,
    ];

  for (
    let id = 1;
    id < objects.length;
    id++
  ) {
    offsets[id] =
      pdf.length;

    pdf +=
      `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset =
    pdf.length;

  pdf +=
    `xref\n0 ${objects.length}\n`;

  pdf +=
    "0000000000 65535 f \n";

  for (
    let id = 1;
    id < objects.length;
    id++
  ) {
    pdf +=
      `${String(
        offsets[id]
      ).padStart(
        10,
        "0"
      )} 00000 n \n`;
  }

  pdf +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob =
    new Blob(
      [
        new TextEncoder()
          .encode(
            pdf
          ),
      ],
      {
        type: "application/pdf",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;
  link.download =
    fileName
      .toLowerCase()
      .endsWith(
        ".pdf"
      )
      ? fileName
      : `${fileName}.pdf`;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  URL.revokeObjectURL(
    url
  );
}
