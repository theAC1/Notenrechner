
import React, { RefObject } from 'react';

type StudentInputBarProps = {
    neuerName: string;
    setNeuerName: (val: string) => void;
    neuePunkte: string;
    setNeuePunkte: (val: string) => void;
    maxPunkte: number;
    onAdd: () => void;
    onDownloadTemplate: () => void;
    onExport: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: RefObject<HTMLInputElement>;
    nameInputRef: RefObject<HTMLInputElement>;
    hasSchueler: boolean;
};

export const StudentInputBar: React.FC<StudentInputBarProps> = ({
    neuerName,
    setNeuerName,
    neuePunkte,
    setNeuePunkte,
    maxPunkte,
    onAdd,
    onDownloadTemplate,
    onExport,
    onFileUpload,
    fileInputRef,
    nameInputRef,
    hasSchueler
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-3 items-center">
                {/* Neuer Schüler */}
                <div className="flex gap-2 flex-1 min-w-[300px]">
                    <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="Name"
                        value={neuerName}
                        onChange={(e) => setNeuerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAdd()}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="number"
                        placeholder="Punkte"
                        value={neuePunkte}
                        onChange={(e) => setNeuePunkte(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAdd()}
                        min="0"
                        max={maxPunkte}
                        className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                    >
                        + Hinzufügen
                    </button>
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px h-8 bg-gray-300"></div>

                {/* CSV Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onDownloadTemplate}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                        title="CSV-Vorlage herunterladen"
                    >
                        📥 Vorlage
                    </button>
                    <label className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm cursor-pointer">
                        📤 Importieren
                        <input type="file" accept=".csv,.txt" onChange={onFileUpload} ref={fileInputRef} className="hidden" />
                    </label>
                    {hasSchueler && (
                        <button
                            onClick={onExport}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                            title="Liste als CSV exportieren"
                        >
                            💾 Export
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
