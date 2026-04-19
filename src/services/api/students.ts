import type { LibraryStudent, LibraryStudentInput } from '@/domain/library';
import { apiFetch } from './client';

export async function listStudents(): Promise<ReadonlyArray<LibraryStudent>> {
  const res = await apiFetch<{ students: LibraryStudent[] }>('/api/students/');
  return res.students;
}

export async function createStudent(input: LibraryStudentInput): Promise<LibraryStudent> {
  const res = await apiFetch<{ student: LibraryStudent }>('/api/students/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.student;
}

export async function updateStudent(id: string, input: LibraryStudentInput): Promise<LibraryStudent> {
  const res = await apiFetch<{ student: LibraryStudent }>(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.student;
}

export async function deleteStudent(id: string): Promise<void> {
  await apiFetch<void>(`/api/students/${id}`, { method: 'DELETE' });
}

export async function bulkCreateStudents(
  students: ReadonlyArray<LibraryStudentInput>,
): Promise<ReadonlyArray<LibraryStudent>> {
  const res = await apiFetch<{ students: LibraryStudent[] }>('/api/students/bulk', {
    method: 'POST',
    body: JSON.stringify({ students }),
  });
  return res.students;
}
