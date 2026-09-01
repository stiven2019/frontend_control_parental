import React from 'react';

/**
 * Parsea y renderiza texto con formato enriquecido:
 * - Tablas Markdown (| col 1 | col 2 | ...)
 * - Títulos y subtítulos en negrita (**Título:**)
 * - Viñetas y listas con iconos inteligentes (✅, ❌, 🚨, 📌, 💊)
 * - Bloques de advertencia y emergencia
 */
export default function FormattedContent({ text, className = '' }) {
  if (!text) return null;

  const blocks = parseTextToBlocks(text);

  return (
    <div className={`flex flex-col gap-4 text-sm font-body ${className}`}>
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}

function parseTextToBlocks(rawText) {
  // Limpiar caracteres y normalizar saltos de línea
  const clean = String(rawText || '').replace(/\r\n/g, '\n');

  const lines = clean.split('\n');
  const blocks = [];
  let currentParagraph = [];
  let currentList = [];
  let currentTable = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList });
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable && currentTable.rows.length > 0) {
      blocks.push({ type: 'table', header: currentTable.header, rows: currentTable.rows });
      currentTable = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    // 1. Detectar fila de Tabla Markdown (| a | b | c |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph();
      flushList();

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Verificar si es fila separadora (|---|---|)
      const isSeparator = cells.every((c) => /^[-:]+$/.test(c));

      if (isSeparator) {
        continue;
      }

      if (!currentTable) {
        currentTable = { header: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else if (currentTable) {
      flushTable();
    }

    // 2. Detectar Encabezado de Sección (**Título:** o **Título**)
    const isHeading = /^(\*\*.+\*\*|\#{2,4}\s.+)/.test(trimmed);
    if (isHeading) {
      flushParagraph();
      flushList();
      flushTable();

      const headingText = trimmed.replace(/^(\*\*|\#{2,4}\s*)/, '').replace(/\*\*$/, '').replace(/:$/, '').trim();
      const isDanger = /EVITAR|PARAR|EMERGENCIA|URGENCIA|PELIGRO|ALERTA/i.test(headingText);
      const isSafe = /seguros|Recomendado|HACER|Nutrientes/i.test(headingText);

      blocks.push({
        type: 'heading',
        text: headingText,
        tone: isDanger ? 'danger' : isSafe ? 'success' : 'default',
      });
      continue;
    }

    // 3. Detectar Viñetas / List Items
    // Casos: "V ", "? ", "• ", "- ", "* ", "?? ", "🚨 ", "  ", o texto con prefijo
    const isExplicitBullet = /^(V\s+|\?\s+|\?\?\s+|•\s+|-\s+|\*\s+|✅\s*|❌\s*|🚨\s*|📌\s*)/.test(trimmed);
    const isIndented = rawLine.startsWith('  ') || rawLine.startsWith('\t');
    const isKeyValue = /^([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s/().-]+):(.+)$/.test(trimmed) && trimmed.length < 120;

    if (isExplicitBullet || isIndented || isKeyValue) {
      flushParagraph();

      let itemText = trimmed;
      let itemType = 'default';

      if (/^(V\s+|✅\s*)/.test(itemText)) {
        itemType = 'check';
        itemText = itemText.replace(/^(V\s+|✅\s*)/, '');
      } else if (/^(\?\s+|❌\s*)/.test(itemText)) {
        itemType = 'cross';
        itemText = itemText.replace(/^(\?\s+|❌\s*)/, '');
      } else if (/^(\?\?\s+|🚨\s*)/.test(itemText)) {
        itemType = 'warning';
        itemText = itemText.replace(/^(\?\?\s+|🚨\s*)/, '');
      } else {
        itemText = itemText.replace(/^[•\-*]\s*/, '');
      }

      currentList.push({ text: itemText, itemType });
      continue;
    }

    // 4. Párrafo estándar
    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushTable();

  return blocks;
}

function renderBlock(block, idx) {
  switch (block.type) {
    case 'heading': {
      const toneStyles = {
        danger: 'bg-error-container/40 text-on-error-container border-l-4 border-error',
        success: 'bg-secondary-container/40 text-on-secondary-container border-l-4 border-secondary',
        default: 'bg-primary-container/30 text-on-primary-container border-l-4 border-primary',
      };

      const toneIcons = {
        danger: '⚠️',
        success: '✨',
        default: '📌',
      };

      return (
        <div
          key={idx}
          className={`p-3 rounded-r-xl mt-3 ${toneStyles[block.tone] || toneStyles.default}`}
        >
          <h4 className="font-display font-semibold text-sm md:text-base flex items-center gap-2">
            <span>{toneIcons[block.tone]}</span>
            <span>{block.text}</span>
          </h4>
        </div>
      );
    }

    case 'table': {
      return (
        <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-outline-variant/40 shadow-sm bg-white">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/40 text-on-surface">
                {block.header.map((col, cIdx) => (
                  <th key={cIdx} className="py-3 px-4 font-display font-semibold tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-outline-variant/20 last:border-0 even:bg-surface-low hover:bg-surface-container/50 transition-colors"
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-3 px-4 text-on-surface-variant font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'list': {
      return (
        <ul key={idx} className="space-y-2 my-1 pl-1">
          {block.items.map((item, iIdx) => {
            const bulletInfo = getBulletInfo(item.itemType);
            const { title, description } = parseKeyDescription(item.text);

            return (
              <li
                key={iIdx}
                className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                  item.itemType === 'warning'
                    ? 'bg-error-container/20 text-on-error-container'
                    : 'hover:bg-surface-container/40'
                }`}
              >
                <span className={`shrink-0 text-sm mt-0.5 ${bulletInfo.color}`}>
                  {bulletInfo.icon}
                </span>
                <div className="flex-1 min-w-0">
                  {title ? (
                    <p className="leading-relaxed">
                      <strong className="text-on-surface font-semibold">{title}: </strong>
                      <span className="text-on-surface-variant">{description}</span>
                    </p>
                  ) : (
                    <p className="text-on-surface-variant leading-relaxed">{item.text}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    case 'paragraph':
    default: {
      return (
        <p key={idx} className="text-on-surface-variant leading-relaxed">
          {block.text}
        </p>
      );
    }
  }
}

function getBulletInfo(itemType) {
  switch (itemType) {
    case 'check':
      return { icon: '✅', color: 'text-secondary' };
    case 'cross':
      return { icon: '❌', color: 'text-error' };
    case 'warning':
      return { icon: '🚨', color: 'text-error' };
    default:
      return { icon: '•', color: 'text-primary font-bold' };
  }
}

function parseKeyDescription(text) {
  const parts = text.split(/:\s*(.+)/);
  if (parts.length >= 2 && parts[0].length < 45 && !parts[0].includes('.')) {
    return { title: parts[0].trim(), description: parts[1].trim() };
  }
  return { title: null, description: text };
}
