"use client";

import React, { useState, useMemo } from 'react';

export default function Notenrechner() {
  // Parameter für die Notenskala
  const [maxPunkte, setMaxPunkte] = useState(100);
  const [punkteFuer6, setPunkteFuer6] = useState(100);
  const [punkteFuer4, setPunkteFuer4] = useState(60);
  const [rundungsModus, setRundungsModus] = useState('zehntel');
  const [skalaModus, setSkalaModus] = useState('linear');
  
  // Schülerdaten
  const [schueler, setSchueler] = useState<Array<{id: number, name: string, punkte: number}>>([]);
  const [neuerName, setNeuerName] = useState('');
  const [neuePunkte, setNeuePunkte] = useState('');

  // Skala-Modi Beschreibungen
  const skalaBeschreibungen: Record<string, string> = {
    linear: 'Gleichmässige Verteilung der Punkte',
    's-positiv': 'Grosszügig in der Mitte, streng an den Rändern',
    's-negativ': 'Streng in der Mitte, grosszügig an den Rändern',
    'kurve-positiv': 'Grosszügig – schneller gute Noten',
    'kurve-negativ': 'Streng – schwerer gute Noten zu erreichen'
  };

  // Rundungsfunktion
  const runden = (note: number) => {
    let gerundet;
    switch (rundungsModus) {
      case 'viertel':
        gerundet = Math.round(note * 4) / 4;
        break;
      case 'halbnoten':
        gerundet = Math.round(note * 2) / 2;
        break;
      default: // zehntel
        gerundet = Math.round(note * 10) / 10;
    }
    return Math.min(6, Math.max(1, gerundet));
  };

  // Sigmoid-Funktion für S-Verlauf
  const sigmoid = (x: number, steepness = 5) => {
    return 1 / (1 + Math.exp(-steepness * (x - 0.5)));
  };

  // Normalisierte Sigmoid (0 bis 1 Input -> 0 bis 1 Output)
  const normalizedSigmoid = (x: number, steepness = 5) => {
    const sig = sigmoid(x, steepness);
    const sig0 = sigmoid(0, steepness);
    const sig1 = sigmoid(1, steepness);
    return (sig - sig0) / (sig1 - sig0);
  };

  // Notenberechnung mit verschiedenen Skala-Modi (ohne Rundung für Plot)
  const berechneNoteRoh = (punkte: number) => {
    if (punkte < 0) return 1;
    if (punkte >= punkteFuer6) return 6;
    
    let note;
    
    if (punkte >= punkteFuer4) {
      // Bereich 4-6
      const t = (punkte - punkteFuer4) / (punkteFuer6 - punkteFuer4); // 0 bis 1
      let transformedT;
      
      switch (skalaModus) {
        case 's-positiv':
          transformedT = normalizedSigmoid(t, 4);
          break;
        case 's-negativ':
          transformedT = 1 - normalizedSigmoid(1 - t, 4);
          break;
        case 'kurve-positiv':
          transformedT = Math.pow(t, 0.6); // Wurzel = grosszügiger
          break;
        case 'kurve-negativ':
          transformedT = Math.pow(t, 1.8); // Potenz = strenger
          break;
        default: // linear
          transformedT = t;
      }
      
      note = 4 + transformedT * 2;
    } else {
      // Bereich 1-4
      const t = punkte / punkteFuer4; // 0 bis 1
      let transformedT;
      
      switch (skalaModus) {
        case 's-positiv':
          transformedT = normalizedSigmoid(t, 4);
          break;
        case 's-negativ':
          transformedT = 1 - normalizedSigmoid(1 - t, 4);
          break;
        case 'kurve-positiv':
          transformedT = Math.pow(t, 0.6);
          break;
        case 'kurve-negativ':
          transformedT = Math.pow(t, 1.8);
          break;
        default: // linear
          transformedT = t;
      }
      
      note = 1 + transformedT * 3;
    }
    
    return Math.min(6, Math.max(1, note));
  };

  // Notenberechnung mit Rundung
  const berechneNote = (punkte: number) => {
    return runden(berechneNoteRoh(punkte));
  };

  // Schüler mit berechneten Noten
  const schuelerMitNoten = useMemo(() => {
    return schueler.map(s => ({
      ...s,
      note: berechneNote(s.punkte)
    }));
  }, [schueler, maxPunkte, punkteFuer6, punkteFuer4, rundungsModus, skalaModus]);

  // Daten für den Plot generieren
  const plotDaten = useMemo(() => {
    const punkte = [];
    const step = Math.max(1, Math.floor(punkteFuer6 / 100));
    for (let p = 0; p <= punkteFuer6; p += step) {
      punkte.push({
        x: p,
        y: berechneNoteRoh(p)
      });
    }
    // Endpunkt sicherstellen
    if (punkte[punkte.length - 1].x !== punkteFuer6) {
      punkte.push({ x: punkteFuer6, y: 6 });
    }
    return punkte;
  }, [punkteFuer6, punkteFuer4, skalaModus]);

  // Statistiken
  const statistiken = useMemo(() => {
    if (schuelerMitNoten.length === 0) {
      return { schnitt: 0, ungenuegend: 0, genuegend: 0, verteilung: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } };
    }
    
    const noten = schuelerMitNoten.map(s => s.note);
    const schnitt = noten.reduce((a, b) => a + b, 0) / noten.length;
    const ungenuegend = noten.filter(n => n < 4).length;
    
    const verteilung: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    noten.forEach(n => {
      const ganz = Math.floor(n);
      const key = ganz === 0 ? 1 : Math.min(6, ganz);
      verteilung[key]++;
    });
    
    return {
      schnitt: Math.round(schnitt * 100) / 100,
      ungenuegend,
      genuegend: noten.length - ungenuegend,
      verteilung
    };
  }, [schuelerMitNoten]);

  // Schüler hinzufügen
  const schuelerHinzufuegen = () => {
    if (neuerName.trim() && neuePunkte !== '') {
      const punkte = parseFloat(neuePunkte);
      if (!isNaN(punkte) && punkte >= 0 && punkte <= maxPunkte) {
        setSchueler([...schueler, { 
          id: Date.now(), 
          name: neuerName.trim(), 
          punkte 
        }]);
        setNeuerName('');
        setNeuePunkte('');
      }
    }
  };

  const schuelerEntfernen = (id: number) => {
    setSchueler(schueler.filter(s => s.id !== id));
  };

  const alleLoeschen = () => {
    setSchueler([]);
  };

  const getNotenFarbe = (note: number) => {
    if (note >= 5.5) return 'bg-green-500';
    if (note >= 5) return 'bg-green-400';
    if (note >= 4.5) return 'bg-lime-400';
    if (note >= 4) return 'bg-yellow-400';
    if (note >= 3.5) return 'bg-orange-400';
    if (note >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const maxVerteilung = Math.max(...Object.values(statistiken.verteilung), 1);

  // SVG Plot Komponente
  const NotenskalePlot = () => {
    const width = 400;
    const height = 250;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Skalen
    const xScale = (p: number) => padding.left + (p / punkteFuer6) * plotWidth;
    const yScale = (n: number) => padding.top + plotHeight - ((n - 1) / 5) * plotHeight;

    // Pfad für die Kurve
    const pathD = plotDaten
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`)
      .join(' ');

    // Hilfslinie bei Note 4
    const note4Y = yScale(4);
    
    // Schülerpunkte auf der Kurve
    const schuelerPunkte = schuelerMitNoten.map(s => ({
      x: xScale(s.punkte),
      y: yScale(berechneNoteRoh(s.punkte)),
      name: s.name,
      note: s.note
    }));

    return (
      <svg width={width} height={height} className="bg-white rounded">
        {/* Hintergrund-Bereich für ungenügend */}
        <rect
          x={padding.left}
          y={note4Y}
          width={plotWidth}
          height={plotHeight - (note4Y - padding.top)}
          fill="#fef2f2"
        />
        {/* Hintergrund-Bereich für genügend */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotWidth}
          height={note4Y - padding.top}
          fill="#f0fdf4"
        />

        {/* Gitternetz */}
        {[1, 2, 3, 4, 5, 6].map(note => (
          <g key={note}>
            <line
              x1={padding.left}
              y1={yScale(note)}
              x2={width - padding.right}
              y2={yScale(note)}
              stroke={note === 4 ? '#f59e0b' : '#e5e7eb'}
              strokeWidth={note === 4 ? 2 : 1}
              strokeDasharray={note === 4 ? '0' : '4'}
            />
            <text
              x={padding.left - 10}
              y={yScale(note) + 4}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {note}
            </text>
          </g>
        ))}

        {/* X-Achsen Beschriftung */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const pkt = Math.round(ratio * punkteFuer6);
          return (
            <g key={ratio}>
              <line
                x1={xScale(pkt)}
                y1={padding.top}
                x2={xScale(pkt)}
                y2={height - padding.bottom}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={xScale(pkt)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {pkt}
              </text>
            </g>
          );
        })}

        {/* Markierung für Punkte bei Note 4 */}
        <line
          x1={xScale(punkteFuer4)}
          y1={padding.top}
          x2={xScale(punkteFuer4)}
          y2={height - padding.bottom}
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="6"
        />

        {/* Notenkurve */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Schülerpunkte */}
        {schuelerPunkte.map((s, i) => (
          <g key={i}>
            <circle
              cx={s.x}
              cy={s.y}
              r={6}
              fill={s.note >= 4 ? '#22c55e' : '#ef4444'}
              stroke="white"
              strokeWidth={2}
            />
          </g>
        ))}

        {/* Achsenbeschriftungen */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-sm fill-gray-600 font-medium"
        >
          Punkte
        </text>
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          className="text-sm fill-gray-600 font-medium"
        >
          Note
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          📊 Notenrechner
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linke Spalte: Eingabe */}
          <div className="space-y-4">
            {/* Parameter */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">⚙️ Notenskala einstellen</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max. Punktzahl</label>
                  <input
                    type="number"
                    value={maxPunkte}
                    onChange={(e) => setMaxPunkte(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Punkte für Note 6</label>
                  <input
                    type="number"
                    value={punkteFuer6}
                    onChange={(e) => setPunkteFuer6(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Punkte für Note 4</label>
                  <input
                    type="number"
                    value={punkteFuer4}
                    onChange={(e) => setPunkteFuer4(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rundung</label>
                  <select
                    value={rundungsModus}
                    onChange={(e) => setRundungsModus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="zehntel">Zehntel (0.1)</option>
                    <option value="viertel">Viertel (0.25)</option>
                    <option value="halbnoten">Halbnoten (0.5)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skala-Modus Auswahl */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">📐 Skala-Typ</h2>
              <div className="space-y-2">
                {Object.entries(skalaBeschreibungen).map(([key, beschreibung]) => (
                  <label 
                    key={key}
                    className={`flex items-start p-2 rounded-lg cursor-pointer transition ${
                      skalaModus === key ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="skalaModus"
                      value={key}
                      checked={skalaModus === key}
                      onChange={(e) => setSkalaModus(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-800 capitalize">
                        {key.replace('-', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">{beschreibung}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Schüler hinzufügen */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">➕ Schüler/in hinzufügen</h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={neuerName}
                  onChange={(e) => setNeuerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && schuelerHinzufuegen()}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Pkt"
                  value={neuePunkte}
                  onChange={(e) => setNeuePunkte(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && schuelerHinzufuegen()}
                  min="0"
                  max={maxPunkte}
                  className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={schuelerHinzufuegen}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Schülerliste */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-700">📋 Schülerliste ({schueler.length})</h2>
                {schueler.length > 0 && (
                  <button
                    onClick={alleLoeschen}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Alle löschen
                  </button>
                )}
              </div>
              
              {schuelerMitNoten.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Noch keine Schüler erfasst</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {schuelerMitNoten.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium truncate flex-1">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">{s.punkte}P</span>
                        <span className={`px-2 py-1 rounded text-white font-bold text-sm ${getNotenFarbe(s.note)}`}>
                          {s.note.toFixed(1)}
                        </span>
                        <button
                          onClick={() => schuelerEntfernen(s.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mittlere Spalte: Skala-Visualisierung */}
          <div className="space-y-4">
            {/* Plot */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">📈 Notenskala-Kurve</h2>
              <div className="flex justify-center">
                <NotenskalePlot />
              </div>
              <div className="mt-3 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Genügend</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Ungenügend</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-amber-500"></div>
                  <span>Note 4 Grenze</span>
                </div>
              </div>
            </div>

            {/* Notenverteilung */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-4">📊 Notenverteilung</h2>
              
              {schueler.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Füge Schüler hinzu</p>
              ) : (
                <div className="flex items-end justify-around h-40 gap-2">
                  {[6, 5, 4, 3, 2, 1].map((note) => (
                    <div key={note} className="flex flex-col items-center flex-1">
                      <div className="text-sm font-medium mb-1">{statistiken.verteilung[note]}</div>
                      <div 
                        className={`w-full rounded-t transition-all duration-300 ${
                          note >= 4 ? 'bg-green-400' : 'bg-red-400'
                        }`}
                        style={{ 
                          height: `${(statistiken.verteilung[note] / maxVerteilung) * 120}px`,
                          minHeight: statistiken.verteilung[note] > 0 ? '8px' : '0px'
                        }}
                      />
                      <div className="text-sm font-medium mt-1 text-gray-600">{note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rechte Spalte: Dashboard */}
          <div className="space-y-4">
            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {statistiken.schnitt.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Klassenschnitt</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {statistiken.genuegend}
                  </div>
                  <div className="text-sm text-gray-500">Genügend</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {statistiken.ungenuegend}
                  </div>
                  <div className="text-sm text-gray-500">Ungenügend</div>
                </div>
              </div>
            </div>

            {/* Erfolgsquote */}
            {schueler.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold text-gray-700 mb-3">🎯 Erfolgsquote</h2>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${(statistiken.genuegend / schueler.length) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {Math.round((statistiken.genuegend / schueler.length) * 100)}% bestanden
                  </div>
                </div>
              </div>
            )}

            {/* Notenspiegel */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">🔢 Notenspiegel</h2>
              <div className="grid grid-cols-2 gap-1 text-sm">
                {[6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((note) => {
                  // Invertierte Berechnung: welche Punkte braucht man für diese Note?
                  let punkte;
                  if (note >= 4) {
                    const t = (note - 4) / 2; // 0 bis 1
                    let invertedT;
                    switch (skalaModus) {
                      case 'kurve-positiv':
                        invertedT = Math.pow(t, 1 / 0.6);
                        break;
                      case 'kurve-negativ':
                        invertedT = Math.pow(t, 1 / 1.8);
                        break;
                      default:
                        invertedT = t;
                    }
                    punkte = punkteFuer4 + invertedT * (punkteFuer6 - punkteFuer4);
                  } else {
                    const t = (note - 1) / 3;
                    let invertedT;
                    switch (skalaModus) {
                      case 'kurve-positiv':
                        invertedT = Math.pow(t, 1 / 0.6);
                        break;
                      case 'kurve-negativ':
                        invertedT = Math.pow(t, 1 / 1.8);
                        break;
                      default:
                        invertedT = t;
                    }
                    punkte = invertedT * punkteFuer4;
                  }
                  
                  return (
                    <div 
                      key={note} 
                      className={`flex justify-between p-1.5 rounded ${
                        note >= 4 ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <span className="text-gray-600">{Math.round(punkte)} Pkt</span>
                      <span className="font-medium">= {note.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              {(skalaModus === 's-positiv' || skalaModus === 's-negativ') && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  * Bei S-Kurven ist der Spiegel eine Näherung
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
