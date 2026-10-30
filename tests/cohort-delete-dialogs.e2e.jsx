import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfirmProvider } from '../src/providers/ConfirmProvider.jsx';
import Cohorts from '../src/pages/Cohorts.jsx';
import { api } from '../src/lib/api.js';
import { toast } from 'sonner';

const state = vi.hoisted(() => ({ studentCount: 3 }));

vi.mock('../src/lib/auth.jsx', () => ({
  useAuth: () => ({ user: { role: 'ADMIN' } }),
}));

vi.mock('../src/lib/api.js', () => ({
  api: { del: vi.fn().mockResolvedValue(undefined), post: vi.fn(), patch: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock('../src/components/ui.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useFetch: (path) => ({
      data: path === '/cohorts'
        ? [{
            id: 'cohort-1',
            name: 'JSD-SEP-2026',
            startDate: '2026-09-01',
            course: { title: 'JavaScript' },
            instructors: [],
            _count: { students: state.studentCount },
          }]
        : [],
      error: null,
      reload: vi.fn(),
    }),
  };
});

function renderCohorts(studentCount) {
  state.studentCount = studentCount;
  return render(
    <MemoryRouter>
      <ConfirmProvider>
        <Cohorts />
      </ConfirmProvider>
    </MemoryRouter>,
  );
}

describe('cohort delete dialogs', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('warns and blocks deletion when the cohort still has students', () => {
    renderCohorts(3);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(toast.warning).toHaveBeenCalledWith(
      "Move or remove this cohort's 3 student(s) before deleting it.",
    );
    expect(api.del).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('opens a danger confirmation dialog for an empty cohort', async () => {
    renderCohorts(0);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(
      'Delete cohort "JSD-SEP-2026" and its assignments, quizzes, classes and discussions?',
    )).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toHaveClass('bg-red-600');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => expect(api.del).toHaveBeenCalledWith('/cohorts/cohort-1'));
  });
});
