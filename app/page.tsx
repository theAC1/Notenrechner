"use client";

import React, { useState, useMemo, useRef } from 'react';

type Schueler = {
  id: number;
  name: string;
  punkte: number;
};

type SortOption = 'name-asc' | 'name-desc' | 'punkte-asc' | 'punkte-desc' | 'note-asc' | 'note-desc';

export default function Notenrechner() {
  // Parameter für die Notenskala
  const [maxPunkte, setMaxPunkte] = useState(100);
  const [punkteFuer6, setPunkteFuer6] = useState(100);
  const [punkteFuer4, setPunkteFuer4] = useState(60);
  const [rundungsModus, setRundungsModus] = useState('zehntel');
  const [skalaModus, setSkalaModus] = useState('linear');
  
  // Schülerdaten
  const [schueler, setSchueler] = useState<Schueler[]>([]);
  const [neuerName, setNeuerName] = useState('');
  const [neuePunkte, setNeuePunkte] = useState('');
  const [sortierung, setSortierung] = useState<SortOption>('name-asc');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Schueler[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      default:
        gerundet = Math.round(note * 10) / 10;
    }
    return Math.min(6, Math.max(1, gerundet));
  };

  // Sigmoid-Funktion für S-Verlauf
  const sigmoid = (x: number, steepness = 5) => {
    return 1 / (1 + Math.exp(-steepness * (x - 0.5)));
  };

  // Normalisierte Sigmoid
  const normalizedSigmoid = (x: number, steepness = 5) => {
    const sig = sigmoid(x, steepness);
    const sig0 = sigmoid(0, steepness);
    const sig1 = sigmoid(1, steepness);
    return (sig - sig0) / (sig1 - sig0);
  };

  // Notenberechnung ohne Rundung
  const berechneNoteRoh = (punkte: number) => {
    if (punkte < 0) return 1;
    if (punkte >= punkteFuer6) return 6;
    
    let note;
    
    if (punkte >= punkteFuer4) {
      const t = (punkte - punkteFuer4) / (punkteFuer6 - punkteFuer4);
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
        default:
          transformedT = t;
      }
      
      note = 4 + transformedT * 2;
    } else {
      const t = punkte / punkteFuer4;
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
        default:
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

  // Sortierte Schülerliste
  const sortierteListe = useMemo(() => {
    const liste = [...schuelerMitNoten];
    switch (sortierung) {
      case 'name-asc':
        return liste.sort((a, b) => a.name.localeCompare(b.name, 'de'));
      case 'name-desc':
        return liste.sort((a, b) => b.name.localeCompare(a.name, 'de'));
      case 'punkte-asc':
        return liste.sort((a, b) => a.punkte - b.punkte);
      case 'punkte-desc':
        return liste.sort((a, b) => b.punkte - a.punkte);
      case 'note-asc':
        return liste.sort((a, b) => a.note - b.note);
      case 'note-desc':
        return liste.sort((a, b) => b.note - a.note);
      default:
        return liste;
    }
  }, [schuelerMitNoten, sortierung]);

  // Daten für den Plot generieren
  const plotDaten = useMemo(() => {
    const punkte = [];
    const step = Math.max(1, Math.floor(punkteFuer6 / 100));
    for (let p = 0; p <= punkteFuer6; p += step) {
      punkte.push({ x: p, y: berechneNoteRoh(p) });
    }
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
        setSchueler([...schueler, { id: Date.now(), name: neuerName.trim(), punkte }]);
        setNeuerName('');
        setNeuePunkte('');
      }
    }
  };

  // Punkte aktualisieren
  const punkteAktualisieren = (id: number, neuePunkte: number) => {
    setSchueler(schueler.map(s => 
      s.id === id ? { ...s, punkte: Math.max(0, Math.min(maxPunkte, neuePunkte)) } : s
    ));
  };

  // Name aktualisieren
  const nameAktualisieren = (id: number, neuerName: string) => {
    setSchueler(schueler.map(s => 
      s.id === id ? { ...s, name: neuerName } : s
    ));
  };

  const schuelerEntfernen = (id: number) => {
    setSchueler(schueler.filter(s => s.id !== id));
  };

  const alleLoeschen = () => {
    setSchueler([]);
  };

  // CSV Template herunterladen
  const downloadTemplate = () => {
    const template = "Name;Punkte\nMuster Max;85\nBeispiel Anna;72\n";
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'klassenliste_vorlage.csv';
    link.click();
  };

  // CSV Export
  const exportCSV = () => {
    if (schueler.length === 0) return;
    
    const header = "Name;Punkte;Note\n";
    const rows = schuelerMitNoten.map(s => `${s.name};${s.punkte};${s.note.toFixed(1)}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'klassenliste_export.csv';
    link.click();
  };

  // CSV parsen
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const errors: string[] = [];
    const parsed: Schueler[] = [];
    
    // Header erkennen und überspringen
    const firstLine = lines[0]?.toLowerCase() || '';
    const hasHeader = firstLine.includes('name') || firstLine.includes('punkte');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    dataLines.forEach((line, index) => {
      const lineNum = hasHeader ? index + 2 : index + 1;
      
      // Trenner erkennen (Semikolon oder Komma)
      const separator = line.includes(';') ? ';' : ',';
      const parts = line.split(separator).map(p => p.trim());
      
      if (parts.length < 2) {
        errors.push(`Zeile ${lineNum}: Ungültiges Format`);
        return;
      }
      
      const name = parts[0].replace(/^["']|["']$/g, ''); // Anführungszeichen entfernen
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

  // Datei einlesen
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { parsed, errors } = parseCSV(text);
      setCsvPreview(parsed);
      setCsvErrors(errors);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import bestätigen
  const confirmImport = (replace: boolean) => {
    if (replace) {
      setSchueler(csvPreview);
    } else {
      setSchueler([...schueler, ...csvPreview.map((s, i) => ({ ...s, id: Date.now() + i }))]);
    }
    setShowImportModal(false);
    setCsvPreview([]);
    setCsvErrors([]);
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

  const getNotenFarbeText = (note: number) => {
    if (note >= 4) return 'text-green-600';
    return 'text-red-600';
  };

  const maxVerteilung = Math.max(...Object.values(statistiken.verteilung), 1);

  // SVG Plot Komponente
  const NotenskalePlot = () => {
    const width = 400;
    const height = 250;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const xScale = (p: number) => padding.left + (p / punkteFuer6) * plotWidth;
    const yScale = (n: number) => padding.top + plotHeight - ((n - 1) / 5) * plotHeight;

    const pathD = plotDaten
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`)
      .join(' ');

    const note4Y = yScale(4);
    
    const schuelerPunkte = schuelerMitNoten.map(s => ({
      x: xScale(s.punkte),
      y: yScale(berechneNoteRoh(s.punkte)),
      name: s.name,
      note: s.note
    }));

    return (
      <svg width={width} height={height} className="bg-white rounded">
        <rect x={padding.left} y={note4Y} width={plotWidth} height={plotHeight - (note4Y - padding.top)} fill="#fef2f2" />
        <rect x={padding.left} y={padding.top} width={plotWidth} height={note4Y - padding.top} fill="#f0fdf4" />

        {[1, 2, 3, 4, 5, 6].map(note => (
          <g key={note}>
            <line x1={padding.left} y1={yScale(note)} x2={width - padding.right} y2={yScale(note)}
              stroke={note === 4 ? '#f59e0b' : '#e5e7eb'} strokeWidth={note === 4 ? 2 : 1} strokeDasharray={note === 4 ? '0' : '4'} />
            <text x={padding.left - 10} y={yScale(note) + 4} textAnchor="end" className="text-xs fill-gray-500">{note}</text>
          </g>
        ))}

        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const pkt = Math.round(ratio * punkteFuer6);
          return (
            <g key={ratio}>
              <line x1={xScale(pkt)} y1={padding.top} x2={xScale(pkt)} y2={height - padding.bottom} stroke="#e5e7eb" strokeDasharray="4" />
              <text x={xScale(pkt)} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs fill-gray-500">{pkt}</text>
            </g>
          );
        })}

        <line x1={xScale(punkteFuer4)} y1={padding.top} x2={xScale(punkteFuer4)} y2={height - padding.bottom}
          stroke="#f59e0b" strokeWidth={2} strokeDasharray="6" />

        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

        {schuelerPunkte.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={6} fill={s.note >= 4 ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth={2} />
        ))}

        <text x={width / 2} y={height - 5} textAnchor="middle" className="text-sm fill-gray-600 font-medium">Punkte</text>
        <text x={15} y={height / 2} textAnchor="middle" transform={`rotate(-90, 15, ${height / 2})`} className="text-sm fill-gray-600 font-medium">Note</text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 Notenrechner</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Linke Spalte */}
          <div className="space-y-4">
            {/* Parameter */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">⚙️ Notenskala einstellen</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Max. Punktzahl</label>
                  <input type="number" value={maxPunkte} onChange={(e) => setMaxPunkte(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Punkte für Note 6</label>
                  <input type="number" value={punkteFuer6} onChange={(e) => setPunkteFuer6(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Punkte für Note 4</label>
                  <input type="number" value={punkteFuer4} onChange={(e) => setPunkteFuer4(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Rundung</label>
                  <select value={rundungsModus} onChange={(e) => setRundungsModus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="zehntel">Zehntel (0.1)</option>
                    <option value="viertel">Viertel (0.25)</option>
                    <option value="halbnoten">Halbnoten (0.5)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skala-Modus */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">📐 Skala-Typ</h2>
              <div className="space-y-2">
                {Object.entries(skalaBeschreibungen).map(([key, beschreibung]) => (
                  <label key={key}
                    className={`flex items-start p-2 rounded-lg cursor-pointer transition ${
                      skalaModus === key ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}>
                    <input type="radio" name="skalaModus" value={key} checked={skalaModus === key}
                      onChange={(e) => setSkalaModus(e.target.value)} className="mt-1 mr-3" />
                    <div>
                      <div className="font-medium text-gray-800 capitalize">{key.replace('-', ' ')}</div>
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
                <input type="text" placeholder="Name" value={neuerName} onChange={(e) => setNeuerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && schuelerHinzufuegen()}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" placeholder="Pkt" value={neuePunkte} onChange={(e) => setNeuePunkte(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && schuelerHinzufuegen()} min="0" max={maxPunkte}
                  className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <button onClick={schuelerHinzufuegen} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">+</button>
              </div>
            </div>

            {/* CSV Import/Export */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">📁 CSV Import/Export</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={downloadTemplate}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center justify-center gap-2">
                    <span>📥</span> Vorlage
                  </button>
                  <label className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm flex items-center justify-center gap-2 cursor-pointer">
                    <span>📤</span> Importieren
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                  </label>
                </div>
                {schueler.length > 0 && (
                  <button onClick={exportCSV}
                    className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm flex items-center justify-center gap-2">
                    <span>💾</span> Liste exportieren
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Format: Name;Punkte (Semikolon oder Komma als Trenner)</p>
            </div>
          </div>

          {/* Mittlere Spalte */}
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

            {/* Schülerliste (NEU - grösser und editierbar) */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-700">📋 Schülerliste ({schueler.length})</h2>
                <div className="flex items-center gap-2">
                  <select value={sortierung} onChange={(e) => setSortierung(e.target.value as SortOption)}
                    className="text-sm px-2 py-1 border rounded-lg bg-gray-50">
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="punkte-desc">Punkte ↓</option>
                    <option value="punkte-asc">Punkte ↑</option>
                    <option value="note-desc">Note ↓</option>
                    <option value="note-asc">Note ↑</option>
                  </select>
                  {schueler.length > 0 && (
                    <button onClick={alleLoeschen} className="text-sm text-red-500 hover:text-red-700">Alle löschen</button>
                  )}
                </div>
              </div>
              
              {sortierteListe.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Noch keine Schüler erfasst</p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs text-gray-500 font-medium border-b">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-3 text-center">Punkte</div>
                    <div className="col-span-3 text-center">Note</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {sortierteListe.map((s) => (
                    <div key={s.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded hover:bg-gray-100 group">
                      {/* Name */}
                      <div className="col-span-5">
                        {editingId === s.id ? (
                          <input type="text" value={s.name} onChange={(e) => nameAktualisieren(s.id, e.target.value)}
                            onBlur={() => setEditingId(null)} autoFocus
                            className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500" />
                        ) : (
                          <span onClick={() => setEditingId(s.id)} 
                            className="font-medium truncate block cursor-pointer hover:text-blue-600" title="Klicken zum Bearbeiten">
                            {s.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Punkte */}
                      <div className="col-span-3">
                        <input type="number" value={s.punkte} min="0" max={maxPunkte}
                          onChange={(e) => punkteAktualisieren(s.id, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded text-sm text-center focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      
                      {/* Note */}
                      <div className="col-span-3 flex justify-center">
                        <span className={`px-3 py-1 rounded text-white font-bold text-sm ${getNotenFarbe(s.note)}`}>
                          {s.note.toFixed(1)}
                        </span>
                      </div>
                      
                      {/* Löschen */}
                      <div className="col-span-1 text-right">
                        <button onClick={() => schuelerEntfernen(s.id)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Rechte Spalte */}
          <div className="space-y-4">
            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-4xl font-bold text-blue-600">{statistiken.schnitt.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Klassenschnitt</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{statistiken.genuegend}</div>
                  <div className="text-sm text-gray-500">Genügend</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{statistiken.ungenuegend}</div>
                  <div className="text-sm text-gray-500">Ungenügend</div>
                </div>
              </div>
            </div>

            {/* Notenverteilung */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-4">📊 Notenverteilung</h2>
              {schueler.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Füge Schüler hinzu</p>
              ) : (
                <div className="flex items-end justify-around h-32 gap-2">
                  {[6, 5, 4, 3, 2, 1].map((note) => (
                    <div key={note} className="flex flex-col items-center flex-1">
                      <div className="text-sm font-medium mb-1">{statistiken.verteilung[note]}</div>
                      <div className={`w-full rounded-t transition-all duration-300 ${note >= 4 ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ height: `${(statistiken.verteilung[note] / maxVerteilung) * 80}px`, minHeight: statistiken.verteilung[note] > 0 ? '8px' : '0px' }} />
                      <div className="text-sm font-medium mt-1 text-gray-600">{note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Erfolgsquote */}
            {schueler.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="font-semibold text-gray-700 mb-3">🎯 Erfolgsquote</h2>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                    style={{ width: `${(statistiken.genuegend / schueler.length) * 100}%` }} />
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
                  let punkte;
                  if (note >= 4) {
                    const t = (note - 4) / 2;
                    let invertedT;
                    switch (skalaModus) {
                      case 'kurve-positiv': invertedT = Math.pow(t, 1 / 0.6); break;
                      case 'kurve-negativ': invertedT = Math.pow(t, 1 / 1.8); break;
                      default: invertedT = t;
                    }
                    punkte = punkteFuer4 + invertedT * (punkteFuer6 - punkteFuer4);
                  } else {
                    const t = (note - 1) / 3;
                    let invertedT;
                    switch (skalaModus) {
                      case 'kurve-positiv': invertedT = Math.pow(t, 1 / 0.6); break;
                      case 'kurve-negativ': invertedT = Math.pow(t, 1 / 1.8); break;
                      default: invertedT = t;
                    }
                    punkte = invertedT * punkteFuer4;
                  }
                  return (
                    <div key={note} className={`flex justify-between p-1.5 rounded ${note >= 4 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className="text-gray-600">{Math.round(punkte)} Pkt</span>
                      <span className="font-medium">= {note.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              {(skalaModus === 's-positiv' || skalaModus === 's-negativ') && (
                <p className="text-xs text-gray-400 mt-2 italic">* Bei S-Kurven ist der Spiegel eine Näherung</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">CSV Import Vorschau</h3>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {csvErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-700 mb-2">⚠️ {csvErrors.length} Fehler gefunden:</p>
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
                        {csvPreview.slice(0, 10).map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{s.name}</td>
                            <td className="px-3 py-2 text-right">{s.punkte}</td>
                            <td className={`px-3 py-2 text-right font-medium ${getNotenFarbeText(berechneNote(s.punkte))}`}>
                              {berechneNote(s.punkte).toFixed(1)}
                            </td>
                          </tr>
                        ))}
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
              <button onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition">Abbrechen</button>
              {csvPreview.length > 0 && (
                <>
                  {schueler.length > 0 && (
                    <button onClick={() => confirmImport(false)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">Hinzufügen</button>
                  )}
                  <button onClick={() => confirmImport(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    {schueler.length > 0 ? 'Ersetzen' : 'Importieren'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
