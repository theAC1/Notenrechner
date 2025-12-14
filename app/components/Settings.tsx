
import React from 'react';

type SettingsProps = {
    isOpen: boolean;
    onToggle: () => void;
    maxPunkte: number;
    setMaxPunkte: (val: number) => void;
    punkteFuer6: number;
    setPunkteFuer6: (val: number) => void;
    punkteFuer4: number;
    setPunkteFuer4: (val: number) => void;
    rundungsModus: string;
    setRundungsModus: (val: string) => void;
    skalaModus: string;
    setSkalaModus: (val: string) => void;
};

const skalaBeschreibungen: Record<string, string> = {
    linear: 'Gleichmässig',
    's-positiv': 'Mitte grosszügig',
    's-negativ': 'Mitte streng',
    'kurve-positiv': 'Grosszügig',
    'kurve-negativ': 'Streng'
};

export const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onToggle,
    maxPunkte,
    setMaxPunkte,
    punkteFuer6,
    setPunkteFuer6,
    punkteFuer4,
    setPunkteFuer4,
    rundungsModus,
    setRundungsModus,
    skalaModus,
    setSkalaModus
}) => {
    return (
        <div className="bg-white rounded-lg shadow">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg transition"
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-gray-700">⚙️ Einstellungen</span>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="px-4 pb-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Max. Punktzahl</label>
                            <input type="number" value={maxPunkte} onChange={(e) => setMaxPunkte(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Punkte für 6</label>
                            <input type="number" value={punkteFuer6} onChange={(e) => setPunkteFuer6(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Punkte für 4</label>
                            <input type="number" value={punkteFuer4} onChange={(e) => setPunkteFuer4(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Rundung</label>
                            <select value={rundungsModus} onChange={(e) => setRundungsModus(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="zehntel">Zehntel</option>
                                <option value="viertel">Viertel</option>
                                <option value="halbnoten">Halbnoten</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Skala-Typ</label>
                            <select value={skalaModus} onChange={(e) => setSkalaModus(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                {Object.entries(skalaBeschreibungen).map(([key, desc]) => (
                                    <option key={key} value={key}>{desc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
