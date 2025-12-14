
import React, { useState } from 'react';
import { GradeCurvePlot } from './GradeCurvePlot';
import { berechnePunkte } from '../utils/gradeCalculations';
import { Schueler } from '../types';

type Statistics = {
    schnitt: number;
    ungenuegend: number;
    genuegend: number;
    verteilung: Record<number, number>;
};

type SidebarProps = {
    schueler: Schueler[];
    statistiken: Statistics;
    punkteFuer6: number;
    punkteFuer4: number;
    skalaModus: string;
    schuelerMitNoten: { id: number; punkte: number; name: string; note: number }[];
};

export const Sidebar: React.FC<SidebarProps> = ({
    schueler,
    statistiken,
    punkteFuer6,
    punkteFuer4,
    skalaModus,
    schuelerMitNoten
}) => {
    const [showKurve, setShowKurve] = useState(true);
    const [showNotenspiegel, setShowNotenspiegel] = useState(true);

    const maxVerteilung = Math.max(...Object.values(statistiken.verteilung), 1);

    return (
        <div className="lg:w-80 space-y-4">
            {/* Statistik-Karten */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-blue-600">
                        {schueler.length > 0 ? statistiken.schnitt.toFixed(2) : '–'}
                    </div>
                    <div className="text-sm text-gray-500">Klassenschnitt</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{statistiken.genuegend}</div>
                        <div className="text-xs text-green-700">Genügend</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{statistiken.ungenuegend}</div>
                        <div className="text-xs text-red-700">Ungenügend</div>
                    </div>
                </div>

                {/* Erfolgsquote */}
                {schueler.length > 0 && (
                    <div className="mt-4">
                        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                                style={{ width: `${(statistiken.genuegend / schueler.length) * 100}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                {Math.round((statistiken.genuegend / schueler.length) * 100)}% bestanden
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notenverteilung */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">📊 Verteilung</h3>
                {schueler.length === 0 ? (
                    <div className="text-gray-400 text-center py-4 text-sm">Keine Daten</div>
                ) : (
                    <div className="flex items-end justify-around h-24 gap-1">
                        {[6, 5, 4, 3, 2, 1].map((note) => (
                            <div key={note} className="flex flex-col items-center flex-1">
                                <div className="text-xs font-medium mb-1">{statistiken.verteilung[note]}</div>
                                <div
                                    className={`w-full rounded-t transition-all duration-300 ${note >= 4 ? 'bg-green-400' : 'bg-red-400'}`}
                                    style={{
                                        height: `${(statistiken.verteilung[note] / maxVerteilung) * 60}px`,
                                        minHeight: statistiken.verteilung[note] > 0 ? '4px' : '0px'
                                    }}
                                />
                                <div className="text-xs font-medium mt-1 text-gray-600">{note}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notenkurve (kollabierbar) */}
            <div className="bg-white rounded-lg shadow">
                <button
                    onClick={() => setShowKurve(!showKurve)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition"
                >
                    <span className="font-semibold text-gray-700 text-sm">📈 Notenkurve</span>
                    <span className={`transform transition-transform text-sm ${showKurve ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showKurve && (
                    <div className="px-4 pb-4 flex justify-center">
                        <GradeCurvePlot
                            punkteFuer6={punkteFuer6}
                            punkteFuer4={punkteFuer4}
                            skalaModus={skalaModus}
                            schuelerMitNoten={schuelerMitNoten}
                        />
                    </div>
                )}
            </div>

            {/* Notenspiegel (kollabierbar) */}
            <div className="bg-white rounded-lg shadow">
                <button
                    onClick={() => setShowNotenspiegel(!showNotenspiegel)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition"
                >
                    <span className="font-semibold text-gray-700 text-sm">🔢 Notenspiegel</span>
                    <span className={`transform transition-transform text-sm ${showNotenspiegel ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showNotenspiegel && (
                    <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-1 text-sm">
                            {[6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((note) => {
                                const punkte = berechnePunkte(note, punkteFuer6, punkteFuer4, skalaModus);
                                return (
                                    <div key={note} className={`flex justify-between p-1.5 rounded text-xs ${note >= 4 ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <span className="text-gray-600">{Math.round(punkte)} Pkt</span>
                                        <span className="font-medium">= {note.toFixed(1)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {(skalaModus === 's-positiv' || skalaModus === 's-negativ') && (
                            <p className="text-xs text-gray-400 mt-2 italic">* Bei S-Kurven Näherung</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
