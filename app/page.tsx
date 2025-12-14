
"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Schueler, SortOption } from './types';
import { berechneNote } from './utils/gradeCalculations';
import { parseCSV } from './utils/csvUtils';
import { Settings } from './components/Settings';
import { StudentInputBar } from './components/StudentInputBar';
import { StudentList } from './components/StudentList';
import { Sidebar } from './components/Sidebar';
import { ImportModal } from './components/ImportModal';

export default function Notenrechner() {
  // Parameter für die Notenskala
  const [maxPunkte, setMaxPunkte] = useState(100);
  const [punkteFuer6, setPunkteFuer6] = useState(100);
  const [punkteFuer4, setPunkteFuer4] = useState(60);
  const [rundungsModus, setRundungsModus] = useState('zehntel');
  const [skalaModus, setSkalaModus] = useState('linear');

  // UI State
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Schülerdaten
  const [schueler, setSchueler] = useState<Schueler[]>([]);
  const [neuerName, setNeuerName] = useState('');
  const [neuePunkte, setNeuePunkte] = useState('');
  const [sortierung, setSortierung] = useState<SortOption>('name-asc');

  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Schueler[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Schüler mit berechneten Noten
  const schuelerMitNoten = useMemo(() => {
    return schueler.map(s => ({
      ...s,
      note: berechneNote(s.punkte, punkteFuer6, punkteFuer4, skalaModus, rundungsModus)
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
        nameInputRef.current?.focus();
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
    if (confirm('Alle Schüler löschen?')) {
      setSchueler([]);
    }
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

  // Datei einlesen
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { parsed, errors } = parseCSV(text, maxPunkte);
      setCsvPreview(parsed);
      setCsvErrors(errors);
      setShowImportModal(true);
    };
    reader.readAsText(file);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800">📊 Notenrechner</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <Settings
          isOpen={settingsOpen}
          onToggle={() => setSettingsOpen(!settingsOpen)}
          maxPunkte={maxPunkte}
          setMaxPunkte={setMaxPunkte}
          punkteFuer6={punkteFuer6}
          setPunkteFuer6={setPunkteFuer6}
          punkteFuer4={punkteFuer4}
          setPunkteFuer4={setPunkteFuer4}
          rundungsModus={rundungsModus}
          setRundungsModus={setRundungsModus}
          skalaModus={skalaModus}
          setSkalaModus={setSkalaModus}
        />

        <StudentInputBar
          neuerName={neuerName}
          setNeuerName={setNeuerName}
          neuePunkte={neuePunkte}
          setNeuePunkte={setNeuePunkte}
          maxPunkte={maxPunkte}
          onAdd={schuelerHinzufuegen}
          onDownloadTemplate={downloadTemplate}
          onExport={exportCSV}
          onFileUpload={handleFileUpload}
          fileInputRef={fileInputRef}
          nameInputRef={nameInputRef}
          hasSchueler={schueler.length > 0}
        />

        {/* Hauptbereich: Liste + Sidebar */}
        <div className="flex gap-4 flex-col lg:flex-row">
          <StudentList
            schuelerCount={schueler.length}
            sortierteListe={sortierteListe}
            sortierung={sortierung}
            setSortierung={setSortierung}
            maxPunkte={maxPunkte}
            onUpdateName={nameAktualisieren}
            onUpdatePunkte={punkteAktualisieren}
            onDelete={schuelerEntfernen}
            onDeleteAll={alleLoeschen}
          />

          <Sidebar
            schueler={schueler}
            statistiken={statistiken}
            punkteFuer6={punkteFuer6}
            punkteFuer4={punkteFuer4}
            skalaModus={skalaModus}
            schuelerMitNoten={schuelerMitNoten}
          />
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onConfirm={confirmImport}
        csvPreview={csvPreview}
        csvErrors={csvErrors}
        existingCount={schueler.length}
        punkteFuer6={punkteFuer6}
        punkteFuer4={punkteFuer4}
        skalaModus={skalaModus}
        rundungsModus={rundungsModus}
      />
    </div>
  );
}
