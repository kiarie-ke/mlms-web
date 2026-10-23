import '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/lib/auth.jsx';
import App from '../src/App.jsx';

vi.mock('../src/components/Layout.jsx', async () => {
  const { Outlet } = await import('react-router-dom');
  return { default: () => <Outlet /> };
});
vi.mock('../src/pages/Administration.jsx', () => ({ default: () => <h1>Admin route rendered</h1> }));
vi.mock('../src/pages/Quizzes.jsx', () => ({ default: () => <h1>Instructor route rendered</h1> }));
vi.mock('../src/pages/Grades.jsx', () => ({ default: () => <h1>Student route rendered</h1> }));

const jsonResponse = (body, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 401 ? 'Unauthorized' : 'OK',
    json: async () => body,
  });

function NavigateAfterLogin({ path }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(path);
  }, [user, path, navigate]);
  return null;
}

describe('login and role routes', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('redirects an unauthenticated visit to the login page', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ message: 'Unauthorized' }, 401)));
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getAllByText(/v0\.1\.0/).length).toBeGreaterThan(0);
  });

  it.each([
    ['ADMIN', '/admin', 'Admin route rendered'],
    ['INSTRUCTOR', '/quizzes', 'Instructor route rendered'],
    ['STUDENT', '/grades', 'Student route rendered'],
  ])('renders the %s menu route after login', async (role, path, expectedHeading) => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) =>
        url === '/api/auth/login'
          ? jsonResponse({ id: 'test-user', email: 'user@example.test', name: 'Test', role })
          : url === '/api/messages/presence'
            ? jsonResponse({}, 204)
          : jsonResponse({ message: 'Unauthorized' }, 401),
      ),
    );
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <App />
          <NavigateAfterLogin path={path} />
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByPlaceholderText('you@example.com'), {
      target: { value: 'user@example.test' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: expectedHeading })).toBeInTheDocument();
    });
  });
});
