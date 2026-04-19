import type { GradingConfig } from '@/domain/types';
import { apiFetch } from './client';

export interface RemoteExamStudent {
  readonly studentId: string;
  readonly name: string;
  readonly klasse: string | null;
  readonly stufe: string | null;
  readonly points: number;
}

export interface RemoteExam {
  readonly id: string;
  readonly name: string;
  readonly subject: string | null;
  readonly date: string;
  readonly config: GradingConfig;
  readonly students: ReadonlyArray<RemoteExamStudent>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ExamWriteInput {
  readonly name: string;
  readonly subject?: string | null;
  readonly date: string;
  readonly config: GradingConfig;
  readonly students: ReadonlyArray<{ studentId: string; points: number }>;
}

export async function listExams(): Promise<ReadonlyArray<RemoteExam>> {
  const res = await apiFetch<{ exams: RemoteExam[] }>('/api/exams/');
  return res.exams;
}

export async function createExam(input: ExamWriteInput): Promise<RemoteExam> {
  const res = await apiFetch<{ exam: RemoteExam }>('/api/exams/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.exam;
}

export async function updateExam(id: string, input: ExamWriteInput): Promise<RemoteExam> {
  const res = await apiFetch<{ exam: RemoteExam }>(`/api/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return res.exam;
}

export async function deleteExam(id: string): Promise<void> {
  await apiFetch<void>(`/api/exams/${id}`, { method: 'DELETE' });
}
