export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil?: 'ADMIN' | 'USUARIO';
  avatarUrl?: string;
  emailVerifiedAt?: string | null;
  contaConjuntaAtiva?: boolean;
  parceiroNome?: string;
  parceiroEmail?: string;
}

export interface ContaConjuntaInfo {
  id: string;
  nomeConta: string;
  usuario1: { id: string; nome: string };
  usuario2: { id: string; nome: string };
  proporcaoDivisao: number;
  totalCompartilhadoMes: number;
  totalPagoUsuario1: number;
  totalPagoUsuario2: number;
  saldoAjuste: {
    devedorId: string;
    credorId: string;
    valor: number;
  };
}
