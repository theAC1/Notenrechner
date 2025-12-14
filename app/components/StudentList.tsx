
import React, { useState } from 'react';
import { SortOption } from '../types';
import { getNotenFarbe } from '../utils/gradeCalculations';

type StudentListProps = {
    schuelerCount: number;
    sortierteListe: { id: number; name: string; punkte: number; note: number }[];
    sortierung: SortOption;
    setSortierung: (s: SortOption) => void;
    maxPunkte: number;
    onUpdateName: (id: number, name: string) => void;
    onUpdatePunkte: (id: number, punkte: number) => void;
    onDelete: (id: number) => void;
    onDeleteAll: () => void;
};

export const StudentList: React.FC<StudentListProps> = ({
    schuelerCount,
    sortierteListe,
    sortierung,
    setSortierung,
    maxPunkte,
    onUpdateName,
    onUpdatePunkte,
    onDelete,
    onDeleteAll
}) => {
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <div className="flex-1 bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-700">📋 Schülerliste ({schuelerCount})</h2>
                <div className="flex items-center gap-3">
                    <select
                        value={sortierung}
                        onChange={(e) => setSortierung(e.target.value as SortOption)}
                        className="text-sm px-2 py-1 border rounded-lg bg-gray-50"
                        aria-label="Sortierung"
                    >
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="punkte-desc">Punkte ↓</option>
                        <option value="punkte-asc">Punkte ↑</option>
                        <option value="note-desc">Note ↓</option>
                        <option value="note-asc">Note ↑</option>
                    </select>
                    {schuelerCount > 0 && (
                        <button onClick={onDeleteAll} className="text-sm text-red-500 hover:text-red-700">
                            Alle löschen
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                {sortierteListe.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <div className="text-4xl mb-3">📝</div>
                        <p>Noch keine Schüler erfasst</p>
                        <p className="text-sm mt-1">Füge oben Schüler hinzu oder importiere eine CSV-Datei</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-gray-500 border-b">
                                    <th className="pb-2 font-medium">Name</th>
                                    <th className="pb-2 font-medium text-center w-32">Punkte</th>
                                    <th className="pb-2 font-medium text-center w-24">Note</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortierteListe.map((s) => (
                                    <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 group">
                                        <td className="py-2 pr-4">
                                            {editingId === s.id ? (
                                                <input
                                                    type="text"
                                                    value={s.name}
                                                    onChange={(e) => onUpdateName(s.id, e.target.value)}
                                                    onBlur={() => setEditingId(null)}
                                                    onKeyPress={(e) => e.key === 'Enter' && setEditingId(null)}
                                                    autoFocus
                                                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                                                    aria-label={`Name bearbeiten für ${s.name}`}
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => setEditingId(s.id)}
                                                    className="text-left hover:text-blue-600 focus:outline-none focus:text-blue-600 w-full"
                                                    title="Klicken zum Bearbeiten"
                                                >
                                                    {s.name}
                                                </button>
                                            )}
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={s.punkte}
                                                min="0"
                                                max={maxPunkte}
                                                onChange={(e) => onUpdatePunkte(s.id, parseFloat(e.target.value) || 0)}
                                                className="w-full px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 bg-white"
                                                aria-label={`Punkte für ${s.name}`}
                                            />
                                        </td>
                                        <td className="py-2 text-center">
                                            <span className={`inline-block px-3 py-1 rounded text-white font-bold text-sm min-w-[3rem] ${getNotenFarbe(s.note)}`}>
                                                {s.note.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="py-2 text-center">
                                            <button
                                                onClick={() => onDelete(s.id)}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                title="Löschen"
                                                aria-label={`Schüler ${s.name} löschen`}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
