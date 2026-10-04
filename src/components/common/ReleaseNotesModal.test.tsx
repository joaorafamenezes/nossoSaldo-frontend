import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as React from 'react';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { Sidebar } from '../layout/Sidebar';
import { useReleaseStore } from '../../stores/useReleaseStore';
import { useAuthStore } from '../../stores/useAuthStore';
import * as api from '../../services/api';
import { APP_VERSION } from '../../config/appMeta';
import { RELEASE_NOTES } from '../../data/releaseNotes';

vi.mock('../../services/api', () => ({
  getReleaseStatus: vi.fn(),
  markReleaseAsViewed: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('ReleaseNotesModal - Gestão de Atualizações e Novidades (CT001 & CT002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      token: 'fake-token-123',
      user: { id: 'u1', nome: 'João', email: 'joao@test.com' } as any,
    });
    useReleaseStore.setState({
      isOpen: false,
      hasUnseenRelease: false,
      latestSeenVersion: null,
      selectedRelease: null,
    });
  });

  it('CT001: exibe notificação e abre as novidades da versão quando o usuário ainda não visualizou a versão atual', async () => {
    // Backend informa que o usuário ainda não viu a versão atual
    vi.mocked(api.getReleaseStatus).mockResolvedValueOnce({
      hasSeenCurrentVersion: false,
      latestSeenVersion: '2.0.0',
      seenVersions: ['2.0.0'],
    });

    render(
      <>
        <Sidebar />
        <ReleaseNotesModal />
      </>
    );

    // Dispara a checagem que ocorre no login
    await waitFor(async () => {
      await useReleaseStore.getState().checkReleaseStatus('fake-token-123');
    });

    // O modal deve estar aberto exibindo o título das novidades
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Novidades do NossoSaldo')).toBeInTheDocument();
    });

    // As novidades da versão mais recente devem estar presentes
    const latest = RELEASE_NOTES[0];
    expect(screen.getByText(latest.title)).toBeInTheDocument();
    expect(screen.getByText(latest.items[0].title)).toBeInTheDocument();

    // Na Sidebar, o indicador de novidade "NOVO ✨" e o ping devem estar visíveis
    expect(screen.getByText('NOVO ✨')).toBeInTheDocument();
    expect(screen.getByTestId('release-unseen-ping')).toBeInTheDocument();
  });

  it('CT002: não exibe notificação nem abre o modal quando o usuário já estiver na versão mais recente', async () => {
    // Backend informa que o usuário já viu a versão atual
    vi.mocked(api.getReleaseStatus).mockResolvedValueOnce({
      hasSeenCurrentVersion: true,
      latestSeenVersion: APP_VERSION,
      seenVersions: [APP_VERSION, '2.0.0'],
    });

    render(
      <>
        <Sidebar />
        <ReleaseNotesModal />
      </>
    );

    // Dispara a checagem no login
    await waitFor(async () => {
      await useReleaseStore.getState().checkReleaseStatus('fake-token-123');
    });

    // Nenhuma notificação deve ser aberta
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Novidades do NossoSaldo')).not.toBeInTheDocument();

    // Na Sidebar, NÃO deve ter o badge "NOVO ✨"
    expect(screen.queryByText('NOVO ✨')).not.toBeInTheDocument();
    expect(screen.queryByTestId('release-unseen-ping')).not.toBeInTheDocument();
  });

  it('ao clicar em "Entendi, vamos lá!", marca a versão como visualizada no backend e fecha o modal', async () => {
    vi.mocked(api.markReleaseAsViewed).mockResolvedValueOnce({
      success: true,
      versao: APP_VERSION,
      visualizadoEm: new Date().toISOString(),
    });

    useReleaseStore.setState({
      isOpen: true,
      hasUnseenRelease: true,
      latestSeenVersion: '2.0.0',
    });

    render(<ReleaseNotesModal />);

    // Verifica que o modal está visível
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Clica no botão de confirmação
    const confirmButton = screen.getByRole('button', { name: /entendi, vamos lá!/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Deve ter chamado a API para salvar no banco de dados com a versão atual
      expect(api.markReleaseAsViewed).toHaveBeenCalledWith(APP_VERSION, 'fake-token-123');
      // Modal é fechado
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // O status de unseen deve ter virado false
    expect(useReleaseStore.getState().hasUnseenRelease).toBe(false);
  });

  it('permite abrir o modal manualmente clicando na versão na Sidebar mesmo quando não há novidade pendente', () => {
    useReleaseStore.setState({
      isOpen: false,
      hasUnseenRelease: false,
      latestSeenVersion: '2.1.0',
    });

    render(
      <>
        <Sidebar />
        <ReleaseNotesModal />
      </>
    );

    // Modal começa fechado
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Clica no botão de versão na Sidebar
    const versionButton = screen.getByRole('button', { name: /ver novidades da versão/i });
    fireEvent.click(versionButton);

    // Modal abre
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Novidades do NossoSaldo')).toBeInTheDocument();
  });
});
