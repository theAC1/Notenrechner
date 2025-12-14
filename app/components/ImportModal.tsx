
import React from 'react';
import { Schueler } from '../types';
import { berechneNote, getNotenFarbeText } from '../utils/gradeCalculations';

type ImportModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (replace: boolean) => void;
    csvPreview: Schueler[];
    csvErrors: string[];
    existingCount: number;
    punkteFuer6: number;
    punkteFuer4: number;
    skalaModus: string;
    rundungsModus: string;
};

export const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    csvPreview,
    csvErrors,
    existingCount,
    punkteFuer6,
    punkteFuer4,
    skalaModus,
    rundungsModus
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">CSV Import Vorschau</h3>
                </div>

                <div className="p-4 overflow-y-auto max-h-96">
                    {csvErrors.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="font-medium text-red-700 mb-2">⚠️ {csvErrors.length} Fehler:</p>
                            <ul className="text-sm text-red-600 list-disc list-inside">
                                {csvErrors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                {csvErrors.length > 5 && <li>...und {csvErrors.length - 5} weitere</li>}
                            </ul>
                        </div>
                    )}

                    {csvPreview.length > 0 && (
                        <div>
                            <p className="font-medium text-gray-700 mb-2">✅ {csvPreview.length} Einträge erkannt:</p>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Name</th>
                                            <th className="px-3 py-2 text-right">Punkte</th>
                                            <th className="px-3 py-2 text-right">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvPreview.slice(0, 10).map((s, i) => {
                                            const note = berechneNote(s.punkte, punkteFuer6, punkteFuer4, skalaModus, rundungsModus);
                                            return (
                                                <tr key={i} className="border-t">
                                                    <td className="px-3 py-2">{s.name}</td>
                                                    <td className="px-3 py-2 text-right">{s.punkte}</td>
                                                    <td className={`px-3 py-2 text-right font-medium ${getNotenFarbeText(note)}`}>
                                                        {note.toFixed(1)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {csvPreview.length > 10 && (
                                    <p className="px-3 py-2 bg-gray-50 text-gray-500 text-sm">...und {csvPreview.length - 10} weitere</p>
                                )}
                            </div>
                        </div>
                    )}

                    {csvPreview.length === 0 && csvErrors.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Keine gültigen Daten gefunden</p>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
                    <button onClick={onClose}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition">Abbrechen</button>
                    {csvPreview.length > 0 && (
                        <>
                            {existingCount > 0 && (
                                <button onClick={() => onConfirm(false)}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">Hinzufügen</button>
                            )}
                            <button onClick={() => onConfirm(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                                {existingCount > 0 ? 'Ersetzen' : 'Importieren'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
