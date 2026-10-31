/**
 * Simple, robust CSV parser and stringifier without external heavy dependencies.
 */

export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

export function toCSV(
  rows: Record<string, unknown>[],
  columns?: { key: string; label: string }[]
): string {
  if (rows.length === 0) return '';

  const cols =
    columns ||
    Object.keys(rows[0]).map((key) => ({
      key,
      label: key,
    }));

  const escapeVal = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = cols.map((col) => escapeVal(col.label)).join(',');
  const rowLines = rows.map((row) =>
    cols.map((col) => escapeVal(row[col.key])).join(',')
  );

  return [headerLine, ...rowLines].join('\n');
}
