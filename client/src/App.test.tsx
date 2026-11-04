import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SignInPage } from './pages/SignInPage';
import { AuthProvider } from './context/AuthContext';

describe('Client UI Preflight', () => {
  it('renders the sign-in screen with both auth methods', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignInPage />
        </BrowserRouter>
      </AuthProvider>
    );
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeDefined();
    // Email OTP and password both available
    expect(await screen.findByText(/email code/i)).toBeDefined();
    expect(await screen.findByText(/password/i)).toBeDefined();
    // Demo one-click accounts render
    expect(await screen.findByText(/one-click demo/i)).toBeDefined();
  });

  it('renders the landing page hero with feature sections', async () => {
    const { LandingPage } = await import('./pages/LandingPage');
    render(
      <AuthProvider>
        <BrowserRouter>
          <LandingPage />
        </BrowserRouter>
      </AuthProvider>
    );
    expect(await screen.findByRole('heading', { name: /run your entire college/i })).toBeDefined();
    expect(screen.getAllByText(/features|consoles|modules/i).length).toBeGreaterThan(0);
  });
});
