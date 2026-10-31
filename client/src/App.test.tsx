import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';

describe('Client UI Preflight', () => {
  it('renders application login screen without crashing', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );
    expect(await screen.findByText(/Mini College ERP/i)).toBeDefined();
    expect(await screen.findByText(/BCA Project No\. 41 by Shagun Kaushal/i)).toBeDefined();
  });
});
