
import React, { useMemo } from 'react';
import { berechneNoteRoh } from '../utils/gradeCalculations';

type GradeCurvePlotProps = {
    punkteFuer6: number;
    punkteFuer4: number;
    skalaModus: string;
    schuelerMitNoten: { punkte: number; name: string; note: number }[];
};

export const GradeCurvePlot: React.FC<GradeCurvePlotProps> = ({
    punkteFuer6,
    punkteFuer4,
    skalaModus,
    schuelerMitNoten,
}) => {
    const width = 280;
    const height = 160;
    const padding = { top: 15, right: 20, bottom: 30, left: 35 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const xScale = (p: number) => padding.left + (p / punkteFuer6) * plotWidth;
    const yScale = (n: number) => padding.top + plotHeight - ((n - 1) / 5) * plotHeight;

    // Daten für den Plot generieren
    const plotDaten = useMemo(() => {
        const punkte = [];
        const step = Math.max(1, Math.floor(punkteFuer6 / 100));
        for (let p = 0; p <= punkteFuer6; p += step) {
            punkte.push({ x: p, y: berechneNoteRoh(p, punkteFuer6, punkteFuer4, skalaModus) });
        }
        if (punkte[punkte.length - 1].x !== punkteFuer6) {
            punkte.push({ x: punkteFuer6, y: 6 });
        }
        return punkte;
    }, [punkteFuer6, punkteFuer4, skalaModus]);

    const pathD = plotDaten
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`)
        .join(' ');

    const note4Y = yScale(4);

    const schuelerPunkte = schuelerMitNoten.map(s => ({
        x: xScale(s.punkte),
        y: yScale(berechneNoteRoh(s.punkte, punkteFuer6, punkteFuer4, skalaModus)),
        name: s.name,
        note: s.note
    }));

    return (
        <svg width={width} height={height} className="bg-white rounded">
            <rect x={padding.left} y={note4Y} width={plotWidth} height={plotHeight - (note4Y - padding.top)} fill="#fef2f2" />
            <rect x={padding.left} y={padding.top} width={plotWidth} height={note4Y - padding.top} fill="#f0fdf4" />

            {[1, 4, 6].map(note => (
                <g key={note}>
                    <line x1={padding.left} y1={yScale(note)} x2={width - padding.right} y2={yScale(note)}
                        stroke={note === 4 ? '#f59e0b' : '#e5e7eb'} strokeWidth={note === 4 ? 2 : 1} />
                    <text x={padding.left - 8} y={yScale(note) + 4} textAnchor="end" className="text-xs fill-gray-500">{note}</text>
                </g>
            ))}

            {[0, 0.5, 1].map(ratio => {
                const pkt = Math.round(ratio * punkteFuer6);
                return (
                    <text key={ratio} x={xScale(pkt)} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs fill-gray-500">{pkt}</text>
                );
            })}

            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {schuelerPunkte.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={4} fill={s.note >= 4 ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth={1.5}>
                    <title>{`${s.name}: ${s.note.toFixed(2)}`}</title>
                </circle>
            ))}
        </svg>
    );
};
