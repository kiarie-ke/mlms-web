import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeachingCalendar from '../src/components/TeachingCalendar.jsx';

describe('dashboard teaching calendar', () => {
  afterEach(cleanup);

  it('shows the selected day’s lessons, cohort, and teaching plan', () => {
    const today = new Date();
    const sessionDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10);
    const event = {
      id: 'session-1',
      title: 'Introduction to the topic',
      date: sessionDate.toISOString(),
      cohort: { name: 'Cohort A' },
      lesson: { id: 'lesson-1', title: 'Core concepts', module: { title: 'Module 1' } },
      teachingPlan: 'Instructor demonstration, then guided practice.',
    };

    render(
      <MemoryRouter>
        <TeachingCalendar events={[event]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Introduction to the topic')).toBeInTheDocument();
    expect(screen.getByText('Cohort A')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Core concepts/ })).toHaveAttribute('href', '/lessons/lesson-1');
    expect(screen.getByText('Instructor demonstration, then guided practice.')).toBeInTheDocument();
  });
});
