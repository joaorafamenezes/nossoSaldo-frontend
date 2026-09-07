import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { DevEnvironmentBanner } from './DevEnvironmentBanner';
import { isDevEnvironment, isProductionEnvironment } from '../../lib/utils';

describe('Ambiente de Desenvolvimento e Banner (DevEnvironmentBanner)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detecta ambiente de desenvolvimento quando em localhost', () => {
    expect(isDevEnvironment()).toBe(true);
    expect(isProductionEnvironment()).toBe(false);
  });

  it('renderiza a tarja amarela quando em ambiente de desenvolvimento', () => {
    render(<DevEnvironmentBanner />);
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent(/Ambiente de Desenvolvimento \/ Local/i);
    expect(banner).toHaveTextContent(/DEV/i);
  });

  it('não renderiza nada se não for ambiente de desenvolvimento', () => {
    // Mock import.meta.env and hostname
    const originalHost = window.location.hostname;
    try {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          hostname: 'app.nossosaldo.com.br',
        },
        writable: true,
      });

      // Se import.meta.env.DEV for false e hostname de prod
      vi.stubEnv('DEV', false);
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_APP_ENV', 'production');

      const { container } = render(<DevEnvironmentBanner />);
      expect(container).toBeEmptyDOMElement();
    } finally {
      vi.unstubAllEnvs();
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    }
  });
});
