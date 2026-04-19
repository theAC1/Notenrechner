import { create } from 'zustand';
import type { LibraryStudent, LibraryStudentInput } from '@/domain/library';
import {
  bulkCreateStudents,
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent,
} from '@/services/api/students';

interface LibraryState {
  students: ReadonlyArray<LibraryStudent>;
  isLoaded: boolean;
  load: () => Promise<void>;
  reset: () => void;
  create: (input: LibraryStudentInput) => Promise<LibraryStudent>;
  update: (id: string, input: LibraryStudentInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkCreate: (inputs: ReadonlyArray<LibraryStudentInput>) => Promise<ReadonlyArray<LibraryStudent>>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  students: [],
  isLoaded: false,

  load: async () => {
    const students = await listStudents();
    set({ students, isLoaded: true });
  },

  reset: () => set({ students: [], isLoaded: false }),

  create: async (input) => {
    const student = await createStudent(input);
    set({ students: [...get().students, student] });
    return student;
  },

  update: async (id, input) => {
    const updated = await updateStudent(id, input);
    set({ students: get().students.map((s) => (s.id === id ? updated : s)) });
  },

  remove: async (id) => {
    await deleteStudent(id);
    set({ students: get().students.filter((s) => s.id !== id) });
  },

  bulkCreate: async (inputs) => {
    const created = await bulkCreateStudents(inputs);
    set({ students: [...get().students, ...created] });
    return created;
  },
}));
