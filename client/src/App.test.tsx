import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';

describe('Client UI Preflight', () => {
  it('renders the login landing screen with sign-in heading and project caption', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeDefined();
    // Brand and project captions exist in the landing header/credits (responsive duplicates allowed)
    expect(screen.getAllByText(/Mini College ERP/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BCA Project No\. 41 by Shagun Kaushal/i).length).toBeGreaterThan(0);
  });
});
