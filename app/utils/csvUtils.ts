
import { Schueler } from '../types';

export const parseCSV = (text: string, maxPunkte: number) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const errors: string[] = [];
    const parsed: Schueler[] = [];

    const firstLine = lines[0]?.toLowerCase() || '';
    const hasHeader = firstLine.includes('name') || firstLine.includes('punkte');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
        const lineNum = hasHeader ? index + 2 : index + 1;
        const separator = line.includes(';') ? ';' : ',';
        const parts = line.split(separator).map(p => p.trim());

        if (parts.length < 2) {
            errors.push(`Zeile ${lineNum}: Ungültiges Format`);
            return;
        }

        const name = parts[0].replace(/^["']|["']$/g, '');
        const punkteStr = parts[1].replace(/^["']|["']$/g, '').replace(',', '.');
        const punkte = parseFloat(punkteStr);

        if (!name) {
            errors.push(`Zeile ${lineNum}: Name fehlt`);
            return;
        }

        if (isNaN(punkte)) {
            errors.push(`Zeile ${lineNum}: "${parts[1]}" ist keine gültige Zahl`);
            return;
        }

        if (punkte < 0 || punkte > maxPunkte) {
            errors.push(`Zeile ${lineNum}: Punkte (${punkte}) ausserhalb 0-${maxPunkte}`);
            return;
        }

        parsed.push({ id: Date.now() + index, name, punkte });
    });

    return { parsed, errors };
};
