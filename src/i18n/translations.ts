import type { Language } from '@/domain/types';

export interface Dictionary {
  app: {
    title: string;
    subtitle: string;
    loading: string;
    noExam: string;
    createFirst: string;
    generatedBy: string;
  };
  nav: {
    edit: string;
    report: string;
    compare: string;
    whatIf: string;
    print: string;
    darkMode: string;
    lightMode: string;
  };
  config: {
    title: string;
    maxPoints: string;
    pointsFor6: string;
    pointsFor4: string;
    pointsFor1: string;
    rounding: string;
    algorithm: string;
    linear: string;
    linearDesc: string;
    nice: string;
    niceDesc: string;
    hard: string;
    hardDesc: string;
    reset: string;
  };
  exam: {
    new: string;
    edit: string;
    duplicate: string;
    delete: string;
    export: string;
    import: string;
    name: string;
    subject: string;
    date: string;
    copyFrom: string;
    deleteConfirm: string;
    deleteConfirmDesc: string;
    cancel: string;
    save: string;
    create: string;
    confirm: string;
  };
  students: {
    title: string;
    add: string;
    name: string;
    points: string;
    grade: string;
    status: string;
    pass: string;
    fail: string;
    actions: string;
    remove: string;
    dropCsv: string;
    loadExample: string;
    empty: string;
  };
  stats: {
    title: string;
    average: string;
    median: string;
    min: string;
    max: string;
    passRate: string;
    stdDev: string;
    count: string;
    distribution: string;
    curve: string;
    boxplot: string;
  };
  whatIf: {
    title: string;
    description: string;
    targetPassRate: string;
    solve: string;
    result: string;
    apply: string;
  };
  compare: {
    title: string;
    select: string;
    addExam: string;
    noSelection: string;
  };
  common: {
    points: string;
    grade: string;
    yes: string;
    no: string;
    close: string;
    error: string;
  };
  toasts: {
    examCreated: string;
    examUpdated: string;
    examDeleted: string;
    examDuplicated: string;
    exported: string;
    imported: string;
    importErrors: string;
    solved: string;
    applied: string;
    undone: string;
    redone: string;
  };
}

export const TRANSLATIONS: Record<Language, Dictionary> = {
  de: {
    app: {
      title: 'Notenrechner',
      subtitle: 'Swiss Grade Calculator — V2',
      loading: 'Laden…',
      noExam: 'Keine Prüfung vorhanden',
      createFirst: 'Erste Prüfung erstellen',
      generatedBy: 'Erstellt mit Notenrechner V2',
    },
    nav: {
      edit: 'Bearbeiten',
      report: 'Report',
      compare: 'Vergleichen',
      whatIf: 'Was-wäre-wenn',
      print: 'Drucken',
      darkMode: 'Dunkler Modus',
      lightMode: 'Heller Modus',
    },
    config: {
      title: 'Konfiguration',
      maxPoints: 'Max. Punktzahl',
      pointsFor6: 'Punkte für Note 6',
      pointsFor4: 'Punkte für Note 4',
      pointsFor1: 'Punkte für Note 1',
      rounding: 'Rundung',
      algorithm: 'Notenskala-Typ',
      linear: 'Linear',
      linearDesc: 'Gleichmässige Verteilung',
      nice: 'Grosszügig',
      niceDesc: 'Schneller gute Noten (konkav)',
      hard: 'Streng',
      hardDesc: 'Schwerer gute Noten (konvex)',
      reset: 'Zurücksetzen',
    },
    exam: {
      new: 'Neue Prüfung',
      edit: 'Bearbeiten',
      duplicate: 'Duplizieren',
      delete: 'Löschen',
      export: 'CSV Export',
      import: 'CSV Import',
      name: 'Name',
      subject: 'Fach',
      date: 'Datum',
      copyFrom: 'Schüler übernehmen von',
      deleteConfirm: 'Prüfung löschen?',
      deleteConfirmDesc: 'Diese Aktion kann nicht rückgängig gemacht werden.',
      cancel: 'Abbrechen',
      save: 'Speichern',
      create: 'Erstellen',
      confirm: 'Bestätigen',
    },
    students: {
      title: 'Schülerliste',
      add: 'Schüler hinzufügen',
      name: 'Name',
      points: 'Punkte',
      grade: 'Note',
      status: 'Status',
      pass: 'Bestanden',
      fail: 'Nicht bestanden',
      actions: 'Aktionen',
      remove: 'Entfernen',
      dropCsv: 'CSV-Datei hier ablegen',
      loadExample: 'Beispieldaten laden',
      empty: 'Noch keine Schüler erfasst',
    },
    stats: {
      title: 'Statistik',
      average: 'Durchschnitt',
      median: 'Median',
      min: 'Min',
      max: 'Max',
      passRate: 'Bestanden',
      stdDev: 'Std. Abw.',
      count: 'Anzahl',
      distribution: 'Notenverteilung',
      curve: 'Notenskala-Kurve',
      boxplot: 'Boxplot',
    },
    whatIf: {
      title: 'Was-wäre-wenn Solver',
      description: 'Berechnet den Punktewert für Note 4 anhand der gewünschten Bestehensquote.',
      targetPassRate: 'Ziel-Bestehensquote (%)',
      solve: 'Berechnen',
      result: 'Vorgeschlagen: Punkte für Note 4',
      apply: 'Übernehmen',
    },
    compare: {
      title: 'Prüfungsvergleich',
      select: 'Prüfungen auswählen',
      addExam: 'Prüfung hinzufügen',
      noSelection: 'Wähle mindestens 2 Prüfungen.',
    },
    common: {
      points: 'Punkte',
      grade: 'Note',
      yes: 'Ja',
      no: 'Nein',
      close: 'Schliessen',
      error: 'Fehler',
    },
    toasts: {
      examCreated: 'Prüfung erstellt',
      examUpdated: 'Prüfung aktualisiert',
      examDeleted: 'Prüfung gelöscht',
      examDuplicated: 'Prüfung dupliziert',
      exported: 'Exportiert',
      imported: '{count} Schüler importiert',
      importErrors: '{count} Zeilen enthielten Fehler',
      solved: 'Lösung berechnet',
      applied: 'Übernommen',
      undone: 'Rückgängig gemacht',
      redone: 'Wiederholt',
    },
  },
  en: {
    app: {
      title: 'Grade Calculator',
      subtitle: 'Swiss Grade Calculator — V2',
      loading: 'Loading…',
      noExam: 'No exam yet',
      createFirst: 'Create first exam',
      generatedBy: 'Generated by Notenrechner V2',
    },
    nav: {
      edit: 'Edit',
      report: 'Report',
      compare: 'Compare',
      whatIf: 'What-if',
      print: 'Print',
      darkMode: 'Dark mode',
      lightMode: 'Light mode',
    },
    config: {
      title: 'Configuration',
      maxPoints: 'Max points',
      pointsFor6: 'Points for grade 6',
      pointsFor4: 'Points for grade 4',
      pointsFor1: 'Points for grade 1',
      rounding: 'Rounding',
      algorithm: 'Curve type',
      linear: 'Linear',
      linearDesc: 'Even distribution',
      nice: 'Generous',
      niceDesc: 'Easier good grades (concave)',
      hard: 'Strict',
      hardDesc: 'Harder good grades (convex)',
      reset: 'Reset',
    },
    exam: {
      new: 'New exam',
      edit: 'Edit',
      duplicate: 'Duplicate',
      delete: 'Delete',
      export: 'Export CSV',
      import: 'Import CSV',
      name: 'Name',
      subject: 'Subject',
      date: 'Date',
      copyFrom: 'Copy students from',
      deleteConfirm: 'Delete exam?',
      deleteConfirmDesc: 'This cannot be undone.',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Create',
      confirm: 'Confirm',
    },
    students: {
      title: 'Students',
      add: 'Add student',
      name: 'Name',
      points: 'Points',
      grade: 'Grade',
      status: 'Status',
      pass: 'Pass',
      fail: 'Fail',
      actions: 'Actions',
      remove: 'Remove',
      dropCsv: 'Drop CSV here',
      loadExample: 'Load example',
      empty: 'No students yet',
    },
    stats: {
      title: 'Statistics',
      average: 'Average',
      median: 'Median',
      min: 'Min',
      max: 'Max',
      passRate: 'Pass rate',
      stdDev: 'Std dev',
      count: 'Count',
      distribution: 'Distribution',
      curve: 'Grading curve',
      boxplot: 'Boxplot',
    },
    whatIf: {
      title: 'What-if solver',
      description: 'Computes the points-for-4 anchor for a target pass rate.',
      targetPassRate: 'Target pass rate (%)',
      solve: 'Solve',
      result: 'Suggested: points for grade 4',
      apply: 'Apply',
    },
    compare: {
      title: 'Exam comparison',
      select: 'Select exams',
      addExam: 'Add exam',
      noSelection: 'Select at least 2 exams.',
    },
    common: {
      points: 'Points',
      grade: 'Grade',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      error: 'Error',
    },
    toasts: {
      examCreated: 'Exam created',
      examUpdated: 'Exam updated',
      examDeleted: 'Exam deleted',
      examDuplicated: 'Exam duplicated',
      exported: 'Exported',
      imported: '{count} students imported',
      importErrors: '{count} rows had errors',
      solved: 'Solution computed',
      applied: 'Applied',
      undone: 'Undone',
      redone: 'Redone',
    },
  },
  fr: {
    app: {
      title: 'Calculateur de Notes',
      subtitle: 'Swiss Grade Calculator — V2',
      loading: 'Chargement…',
      noExam: 'Aucun examen',
      createFirst: 'Créer le premier examen',
      generatedBy: 'Généré par Notenrechner V2',
    },
    nav: {
      edit: 'Éditer',
      report: 'Rapport',
      compare: 'Comparer',
      whatIf: 'Simulation',
      print: 'Imprimer',
      darkMode: 'Mode sombre',
      lightMode: 'Mode clair',
    },
    config: {
      title: 'Configuration',
      maxPoints: 'Points max',
      pointsFor6: 'Points pour note 6',
      pointsFor4: 'Points pour note 4',
      pointsFor1: 'Points pour note 1',
      rounding: 'Arrondi',
      algorithm: "Type d'échelle",
      linear: 'Linéaire',
      linearDesc: 'Distribution égale',
      nice: 'Généreux',
      niceDesc: 'Bonnes notes plus faciles (concave)',
      hard: 'Sévère',
      hardDesc: 'Bonnes notes plus difficiles (convexe)',
      reset: 'Réinitialiser',
    },
    exam: {
      new: 'Nouvel examen',
      edit: 'Éditer',
      duplicate: 'Dupliquer',
      delete: 'Supprimer',
      export: 'Export CSV',
      import: 'Import CSV',
      name: 'Nom',
      subject: 'Matière',
      date: 'Date',
      copyFrom: 'Copier étudiants de',
      deleteConfirm: "Supprimer l'examen ?",
      deleteConfirmDesc: 'Cette action est irréversible.',
      cancel: 'Annuler',
      save: 'Enregistrer',
      create: 'Créer',
      confirm: 'Confirmer',
    },
    students: {
      title: 'Étudiants',
      add: 'Ajouter',
      name: 'Nom',
      points: 'Points',
      grade: 'Note',
      status: 'Statut',
      pass: 'Réussi',
      fail: 'Échoué',
      actions: 'Actions',
      remove: 'Supprimer',
      dropCsv: 'Déposer CSV ici',
      loadExample: "Charger l'exemple",
      empty: 'Aucun étudiant',
    },
    stats: {
      title: 'Statistiques',
      average: 'Moyenne',
      median: 'Médiane',
      min: 'Min',
      max: 'Max',
      passRate: 'Taux de réussite',
      stdDev: 'Écart-type',
      count: 'Nombre',
      distribution: 'Distribution',
      curve: 'Courbe',
      boxplot: 'Boîte à moustaches',
    },
    whatIf: {
      title: 'Simulateur',
      description: "Calcule les points-pour-4 en fonction du taux de réussite souhaité.",
      targetPassRate: 'Taux de réussite cible (%)',
      solve: 'Calculer',
      result: 'Suggéré : points pour note 4',
      apply: 'Appliquer',
    },
    compare: {
      title: 'Comparer examens',
      select: 'Sélectionner',
      addExam: 'Ajouter examen',
      noSelection: 'Sélectionnez au moins 2 examens.',
    },
    common: {
      points: 'Points',
      grade: 'Note',
      yes: 'Oui',
      no: 'Non',
      close: 'Fermer',
      error: 'Erreur',
    },
    toasts: {
      examCreated: 'Examen créé',
      examUpdated: 'Examen mis à jour',
      examDeleted: 'Examen supprimé',
      examDuplicated: 'Examen dupliqué',
      exported: 'Exporté',
      imported: '{count} étudiants importés',
      importErrors: '{count} lignes contiennent des erreurs',
      solved: 'Solution calculée',
      applied: 'Appliqué',
      undone: 'Annulé',
      redone: 'Rétabli',
    },
  },
};
