import React, { useRef } from 'react';
import { Student, GradingConfig, Language } from '../types';
import { Trash2, Copy, FileUp, FileDown, Plus } from 'lucide-react';
import { parseCSV, generateId, downloadCSV, TRANSLATIONS } from '../utils';

interface StudentTableProps {
  students: Student[];
  config: GradingConfig;
  onUpdateStudents: (students: Student[]) => void;
  lang: Language;
}

const StudentTable: React.FC<StudentTableProps> = ({ students, config, onUpdateStudents, lang }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  const addStudent = () => {
    const newStudent: Student = {
      id: generateId(),
      name: `${t.name} ${students.length + 1}`,
      points: 0,
      grade: 0,
      isPassing: false,
    };
    onUpdateStudents([...students, newStudent]);
  };

  const updateStudent = (id: string, field: keyof Student, value: any) => {
    const updated = students.map(s => s.id === id ? { ...s, [field]: value } : s);
    onUpdateStudents(updated);
  };

  const removeStudent = (id: string) => {
    onUpdateStudents(students.filter(s => s.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      const newStudents = parsed.map(p => ({
        id: generateId(),
        name: p.name,
        points: p.points,
        grade: 0,
        isPassing: false
      }));
      onUpdateStudents([...students, ...newStudents]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full transition-colors">
      {/* Header Actions */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center no-print">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-white">{t.students} ({students.length})</h2>
        <div className="flex gap-2">
           <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={t.import}
          >
            <FileUp size={18} />
          </button>
          <button 
            onClick={() => downloadCSV(students)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={t.export}
          >
            <FileDown size={18} />
          </button>
          <button 
            onClick={addStudent}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t.addStudent}</span>
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
        <div className="col-span-5 md:col-span-6 pl-2">{t.name}</div>
        <div className="col-span-3 md:col-span-2 text-right">{t.points}</div>
        <div className="col-span-2 text-center">{t.grade}</div>
        <div className="col-span-2 text-right no-print">{t.actions}</div>
      </div>

      {/* Scrollable List */}
      <div className="overflow-y-auto flex-1 p-0">
        {students.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <p>{t.students}...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {students.map((student) => (
              <div key={student.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group">
                {/* Name Input */}
                <div className="col-span-5 md:col-span-6">
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-1 text-slate-800 dark:text-slate-200 text-sm font-medium placeholder-slate-400 outline-none"
                    placeholder={t.name}
                  />
                </div>
                
                {/* Points Input */}
                <div className="col-span-3 md:col-span-2 flex justify-end">
                   <input
                    type="number"
                    min="0"
                    max={config.maxPossiblePoints}
                    step="0.5"
                    value={student.points}
                    onChange={(e) => updateStudent(student.id, 'points', parseFloat(e.target.value) || 0)}
                    className={`w-20 text-right bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 rounded px-2 py-1 text-sm outline-none transition-all text-slate-800 dark:text-slate-200 ${
                        student.points > config.maxPossiblePoints ? 'text-red-500 font-bold' : ''
                    }`}
                  />
                </div>

                {/* Grade Display */}
                <div className="col-span-2 flex justify-center">
                  <span className={`px-2 py-1 rounded text-sm font-bold w-12 text-center ${
                    student.grade >= 4.0 
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                  }`}>
                    {student.grade.toFixed(1)}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity no-print">
                   <button 
                    onClick={() => removeStudent(student.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTable;