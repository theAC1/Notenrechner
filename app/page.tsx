"use client";

import React, { useState, useMemo, useRef } from 'react';

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
  
  // UI States
  const [showPresentation, setShowPresentation] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [sortierung, setSortierung] = useState<{feld: 'name' | 'punkte' | 'note', richtung: 'asc' | 'desc'} | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPunkte, setEditPunkte] = useState('');
  
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

  const normalizedSigmoid = (x: number, steepness = 5) => {
    const sig = sigmoid(x, steepness);
    const sig0 = sigmoid(0, steepness);
    const sig1 = sigmoid(1, steepness);
    return (sig - sig0) / (sig1 - sig0);
  };

  // Notenberechnung (ohne Rundung für Plot)
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

  const berechneNote = (punkte: number) => runden(berechneNoteRoh(punkte));

  // Schüler mit berechneten Noten
  const schuelerMitNoten = useMemo(() => {
    return schueler.map(s => ({
      ...s,
      note: berechneNote(s.punkte)
    }));
  }, [schueler, maxPunkte, punkteFuer6, punkteFuer4, rundungsModus, skalaModus]);

  // Sortierte Schülerliste
  const sortierteListe = useMemo(() => {
    if (!sortierung) return schuelerMitNoten;
    
    return [...schuelerMitNoten].sort((a, b) => {
      let vergleich = 0;
      switch (sortierung.feld) {
        case 'name':
          vergleich = a.name.localeCompare(b.name);
          break;
        case 'punkte':
          vergleich = a.punkte - b.punkte;
          break;
        case 'note':
          vergleich = a.note - b.note;
          break;
      }
      return sortierung.richtung === 'asc' ? vergleich : -vergleich;
    });
  }, [schuelerMitNoten, sortierung]);

  // Daten für den Plot
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

  const schuelerEntfernen = (id: number) => setSchueler(schueler.filter(s => s.id !== id));
  const alleLoeschen = () => setSchueler([]);

  // Inline-Bearbeitung
  const startEdit = (s: {id: number, name: string, punkte: number}) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPunkte(s.punkte.toString());
  };

  const saveEdit = () => {
    if (editingId !== null && editName.trim() && editPunkte !== '') {
      const punkte = parseFloat(editPunkte);
      if (!isNaN(punkte) && punkte >= 0 && punkte <= maxPunkte) {
        setSchueler(schueler.map(s => 
          s.id === editingId ? { ...s, name: editName.trim(), punkte } : s
        ));
      }
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Sortierung umschalten
  const toggleSort = (feld: 'name' | 'punkte' | 'note') => {
    if (sortierung?.feld === feld) {
      if (sortierung.richtung === 'asc') {
        setSortierung({ feld, richtung: 'desc' });
      } else {
        setSortierung(null);
      }
    } else {
      setSortierung({ feld, richtung: 'asc' });
    }
  };

  const getSortIcon = (feld: 'name' | 'punkte' | 'note') => {
    if (sortierung?.feld !== feld) return '↕';
    return sortierung.richtung === 'asc' ? '↑' : '↓';
  };

  // ==========================================
  // CSV IMPORT / EXPORT FUNKTIONEN
  // ==========================================

  // CSV Template herunterladen
  const downloadTemplate = () => {
    const template = 'Name;Punkte\nMax Mustermann;85\nAnna Beispiel;72\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notenrechner_vorlage.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          setImportError('Die Datei muss mindestens eine Kopfzeile und eine Datenzeile enthalten.');
          return;
        }

        // Erkennung des Trennzeichens (Komma oder Semikolon)
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';
        
        // Header prüfen
        const header = firstLine.toLowerCase().split(separator).map(h => h.trim());
        const nameIndex = header.findIndex(h => h === 'name' || h === 'schüler' || h === 'schülername');
        const punkteIndex = header.findIndex(h => h === 'punkte' || h === 'points' || h === 'score' || h === 'ergebnis');

        if (nameIndex === -1 || punkteIndex === -1) {
          setImportError('Die CSV muss Spalten "Name" und "Punkte" enthalten. Trennzeichen: Komma oder Semikolon.');
          return;
        }

        const neueSchueler: Array<{id: number, name: string, punkte: number}> = [];
        const fehler: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
          
          if (values.length < Math.max(nameIndex, punkteIndex) + 1) {
            fehler.push(`Zeile ${i + 1}: Nicht genügend Spalten`);
            continue;
          }

          const name = values[nameIndex];
          const punkteStr = values[punkteIndex].replace(',', '.');
          const punkte = parseFloat(punkteStr);

          if (!name) {
            fehler.push(`Zeile ${i + 1}: Name fehlt`);
            continue;
          }

          if (isNaN(punkte)) {
            fehler.push(`Zeile ${i + 1}: "${values[punkteIndex]}" ist keine gültige Punktzahl`);
            continue;
          }

          if (punkte < 0) {
            fehler.push(`Zeile ${i + 1}: Negative Punkte nicht erlaubt`);
            continue;
          }

          neueSchueler.push({
            id: Date.now() + i,
            name,
            punkte: Math.min(punkte, maxPunkte)
          });
        }

        if (neueSchueler.length === 0) {
          setImportError('Keine gültigen Einträge gefunden.\n' + fehler.join('\n'));
          return;
        }

        setSchueler([...schueler, ...neueSchueler]);
        
        let message = `${neueSchueler.length} Schüler erfolgreich importiert.`;
        if (fehler.length > 0) {
          message += ` ${fehler.length} Zeilen übersprungen.`;
        }
        setImportSuccess(message);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch {
        setImportError('Fehler beim Lesen der Datei. Bitte prüfe das Format.');
      }
    };
    reader.readAsText(file);
  };

  // CSV Export
  const exportCSV = () => {
    if (schuelerMitNoten.length === 0) return;

    const header = 'Name;Punkte;Note\n';
    const rows = schuelerMitNoten.map(s => 
      `${s.name};${s.punkte};${s.note.toFixed(1)}`
    ).join('\n');
    
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noten_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

  const getRundungsText = () => {
    switch (rundungsModus) {
      case 'viertel': return '0.25';
      case 'halbnoten': return '0.5';
      default: return '0.1';
    }
  };

  const getSkalaText = () => {
    const names: Record<string, string> = {
      'linear': 'Linear',
      's-positiv': 'S-Kurve (+)',
      's-negativ': 'S-Kurve (-)',
      'kurve-positiv': 'Potenz (+)',
      'kurve-negativ': 'Potenz (-)'
    };
    return names[skalaModus] || skalaModus;
  };

  // Generiere Noten-Array basierend auf Rundungsmodus
  const getNotenListe = () => {
    const noten: number[] = [];
    switch (rundungsModus) {
      case 'zehntel':
        for (let n = 6.0; n >= 1.0; n -= 0.1) noten.push(Math.round(n * 10) / 10);
        break;
      case 'viertel':
        for (let n = 6.0; n >= 1.0; n -= 0.25) noten.push(Math.round(n * 4) / 4);
        break;
      case 'halbnoten':
        for (let n = 6.0; n >= 1.0; n -= 0.5) noten.push(Math.round(n * 2) / 2);
        break;
    }
    return noten;
  };

  // Berechne Punkte für eine bestimmte Note (invertierte Berechnung)
  const berechnePunkteFuerNote = (note: number) => {
    if (note >= 4) {
      const t = (note - 4) / 2;
      let invertedT;
      switch (skalaModus) {
        case 'kurve-positiv': invertedT = Math.pow(t, 1 / 0.6); break;
        case 'kurve-negativ': invertedT = Math.pow(t, 1 / 1.8); break;
        default: invertedT = t;
      }
      return punkteFuer4 + invertedT * (punkteFuer6 - punkteFuer4);
    } else {
      const t = (note - 1) / 3;
      let invertedT;
      switch (skalaModus) {
        case 'kurve-positiv': invertedT = Math.pow(t, 1 / 0.6); break;
        case 'kurve-negativ': invertedT = Math.pow(t, 1 / 1.8); break;
        default: invertedT = t;
      }
      return invertedT * punkteFuer4;
    }
  };

  // SVG Plot Komponente
  const NotenskalePlot = ({ width = 400, height = 250 }: { width?: number; height?: number }) => {
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
      <svg width={width} height={height} className="bg-white">
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

  // ==========================================
  // PRÄSENTATIONSANSICHT - Optimiert für Screenshots
  // ==========================================
  if (showPresentation) {
    return (
      <div className="min-h-screen bg-white p-6" id="presentation-view">
        <button
          onClick={() => setShowPresentation(false)}
          className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition shadow-lg print:hidden"
        >
          ✕ Schliessen
        </button>

        <div className="max-w-5xl mx-auto">
          {/* Header mit Einstellungen */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-5 mb-6 shadow-lg">
            <h1 className="text-2xl font-bold mb-4 text-center">📊 Notenauswertung</h1>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs opacity-80">Max. Punkte</div>
                <div className="text-lg font-bold">{maxPunkte}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs opacity-80">Pkt. für 6</div>
                <div className="text-lg font-bold">{punkteFuer6}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs opacity-80">Pkt. für 4</div>
                <div className="text-lg font-bold">{punkteFuer4}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs opacity-80">Skala</div>
                <div className="text-lg font-bold">{getSkalaText()}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs opacity-80">Rundung</div>
                <div className="text-lg font-bold">{getRundungsText()}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <div className="text-xs opacity-80">Schüler</div>
                <div className="text-lg font-bold">{schueler.length}</div>
              </div>
            </div>
          </div>

          {/* Statistik-Karten */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
              <div className="text-4xl font-bold text-blue-600">{statistiken.schnitt.toFixed(2)}</div>
              <div className="text-sm text-blue-700 font-medium">Klassenschnitt</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
              <div className="text-4xl font-bold text-green-600">{statistiken.genuegend}</div>
              <div className="text-sm text-green-700 font-medium">Genügend (≥4)</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center border-2 border-red-200">
              <div className="text-4xl font-bold text-red-600">{statistiken.ungenuegend}</div>
              <div className="text-sm text-red-700 font-medium">Ungenügend (&lt;4)</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center border-2 border-amber-200">
              <div className="text-4xl font-bold text-amber-600">
                {schueler.length > 0 ? Math.round((statistiken.genuegend / schueler.length) * 100) : 0}%
              </div>
              <div className="text-sm text-amber-700 font-medium">Bestanden</div>
            </div>
          </div>

          {/* Hauptbereich: 2x2 Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Notenskala-Kurve */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h2 className="font-bold text-gray-700 mb-3 text-lg">📈 Notenskala-Kurve</h2>
              <div className="flex justify-center">
                <NotenskalePlot width={380} height={220} />
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Genügend</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Ungenügend</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-amber-500"></div>
                  <span>Note 4</span>
                </div>
              </div>
            </div>

            {/* Notenverteilung */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h2 className="font-bold text-gray-700 mb-3 text-lg">📊 Notenverteilung</h2>
              {schueler.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400">Keine Daten</div>
              ) : (
                <div className="flex items-end justify-around h-48 gap-3 px-2">
                  {[6, 5, 4, 3, 2, 1].map((note) => (
                    <div key={note} className="flex flex-col items-center flex-1">
                      <div className="text-lg font-bold mb-1 text-gray-700">{statistiken.verteilung[note]}</div>
                      <div 
                        className={`w-full rounded-t-lg transition-all ${note >= 4 ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ 
                          height: `${Math.max((statistiken.verteilung[note] / maxVerteilung) * 140, statistiken.verteilung[note] > 0 ? 8 : 0)}px`
                        }}
                      />
                      <div className="text-sm font-bold mt-2 text-gray-600">{note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notenspiegel - Kompakt */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h2 className="font-bold text-gray-700 mb-3 text-lg">🔢 Notenspiegel</h2>
              <div className={`grid gap-1 ${
                rundungsModus === 'zehntel' ? 'grid-cols-6 text-xs' : 
                rundungsModus === 'viertel' ? 'grid-cols-4 text-xs' : 
                'grid-cols-3 text-sm'
              }`}>
                {getNotenListe().map((note) => {
                  const punkte = berechnePunkteFuerNote(note);
                  return (
                    <div 
                      key={note} 
                      className={`flex justify-between px-1.5 py-0.5 rounded ${note >= 4 ? 'bg-green-100' : 'bg-red-100'}`}
                    >
                      <span className="text-gray-600">{Math.round(punkte)}P</span>
                      <span className="font-bold">{note.toFixed(rundungsModus === 'viertel' ? 2 : 1)}</span>
                    </div>
                  );
                })}
              </div>
              {(skalaModus === 's-positiv' || skalaModus === 's-negativ') && (
                <p className="text-xs text-gray-400 mt-2 italic text-center">* Näherungswerte bei S-Kurven</p>
              )}
            </div>

            {/* Erfolgsquote visuell */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h2 className="font-bold text-gray-700 mb-3 text-lg">🎯 Erfolgsquote</h2>
              {schueler.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400">Keine Daten</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#fee2e2" strokeWidth="20" />
                    <circle 
                      cx="80" cy="80" r="70" fill="none" stroke="#22c55e" strokeWidth="20"
                      strokeDasharray={`${(statistiken.genuegend / schueler.length) * 440} 440`}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                    />
                    <text x="80" y="75" textAnchor="middle" className="text-3xl font-bold fill-gray-700">
                      {Math.round((statistiken.genuegend / schueler.length) * 100)}%
                    </text>
                    <text x="80" y="95" textAnchor="middle" className="text-sm fill-gray-500">bestanden</text>
                  </svg>
                  <div className="flex gap-6 mt-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>{statistiken.genuegend} genügend</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                      <span>{statistiken.ungenuegend} ungenügend</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            Erstellt mit Notenrechner • {new Date().toLocaleDateString('de-CH')}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NORMALE ANSICHT
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center flex-1">
            📊 Notenrechner
          </h1>
          <button
            onClick={() => setShowPresentation(true)}
            disabled={schueler.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              schueler.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            }`}
          >
            <span>📷</span>
            <span>Screenshot-Ansicht</span>
          </button>
        </div>

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

              {/* Import/Export Buttons */}
              <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                <button
                  onClick={downloadTemplate}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition"
                >
                  📄 Vorlage
                </button>
                <label className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition cursor-pointer">
                  📥 CSV Import
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={exportCSV}
                  disabled={schueler.length === 0}
                  className={`text-xs px-3 py-1.5 rounded transition ${
                    schueler.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  📤 CSV Export
                </button>
              </div>

              {/* Import Feedback */}
              {importError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                  {importError}
                </div>
              )}
              {importSuccess && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
                  {importSuccess}
                </div>
              )}
            </div>

            {/* Schülerliste */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-700">📋 Schülerliste ({schueler.length})</h2>
                {schueler.length > 0 && (
                  <button onClick={alleLoeschen} className="text-sm text-red-500 hover:text-red-700">
                    Alle löschen
                  </button>
                )}
              </div>

              {/* Sortier-Header */}
              {schueler.length > 0 && (
                <div className="flex text-xs text-gray-500 mb-2 px-2">
                  <button 
                    onClick={() => toggleSort('name')} 
                    className="flex-1 text-left hover:text-blue-600"
                  >
                    Name {getSortIcon('name')}
                  </button>
                  <button 
                    onClick={() => toggleSort('punkte')} 
                    className="w-16 text-center hover:text-blue-600"
                  >
                    Pkt {getSortIcon('punkte')}
                  </button>
                  <button 
                    onClick={() => toggleSort('note')} 
                    className="w-14 text-center hover:text-blue-600"
                  >
                    Note {getSortIcon('note')}
                  </button>
                  <div className="w-6"></div>
                </div>
              )}
              
              {sortierteListe.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Noch keine Schüler erfasst</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {sortierteListe.map((s) => (
                    <div key={s.id} className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100">
                      {editingId === s.id ? (
                        // Edit Mode
                        <>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border rounded mr-1"
                            autoFocus
                          />
                          <input
                            type="number"
                            value={editPunkte}
                            onChange={(e) => setEditPunkte(e.target.value)}
                            className="w-14 px-2 py-1 text-sm border rounded mr-1"
                          />
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-800 px-1">✓</button>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 px-1">✕</button>
                        </>
                      ) : (
                        // Display Mode
                        <>
                          <span 
                            className="flex-1 font-medium truncate cursor-pointer hover:text-blue-600"
                            onClick={() => startEdit(s)}
                          >
                            {s.name}
                          </span>
                          <span 
                            className="w-16 text-center text-gray-500 text-sm cursor-pointer hover:text-blue-600"
                            onClick={() => startEdit(s)}
                          >
                            {s.punkte}P
                          </span>
                          <span className={`w-12 text-center px-2 py-0.5 rounded text-white font-bold text-sm ${getNotenFarbe(s.note)}`}>
                            {s.note.toFixed(1)}
                          </span>
                          <button 
                            onClick={() => schuelerEntfernen(s.id)} 
                            className="w-6 text-red-400 hover:text-red-600 text-center"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mittlere Spalte: Skala-Visualisierung */}
          <div className="space-y-4">
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
                        className={`w-full rounded-t transition-all duration-300 ${note >= 4 ? 'bg-green-400' : 'bg-red-400'}`}
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

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">🔢 Notenspiegel</h2>
              <div className="grid grid-cols-2 gap-1 text-sm max-h-96 overflow-y-auto">
                {getNotenListe().map((note) => {
                  const punkte = berechnePunkteFuerNote(note);
                  return (
                    <div 
                      key={note} 
                      className={`flex justify-between p-1.5 rounded ${note >= 4 ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      <span className="text-gray-600">{Math.round(punkte)} Pkt</span>
                      <span className="font-medium">= {note.toFixed(rundungsModus === 'zehntel' ? 1 : rundungsModus === 'viertel' ? 2 : 1)}</span>
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
    </div>
  );
}
