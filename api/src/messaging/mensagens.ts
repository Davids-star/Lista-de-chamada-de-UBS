import type { NotificacaoWhatsApp } from "./publisher";

export function montarMensagem(notificacao: NotificacaoWhatsApp): string {
  switch (notificacao.tipo) {
    case "fila": {
      const pessoas =
        notificacao.pessoasNaFrente === 1
          ? "falta 1 pessoa"
          : `faltam ${notificacao.pessoasNaFrente} pessoas`;
      return `Olá ${notificacao.nome}, ${pessoas} para a sua vez!`;
    }
    case "vez":
      return `Olá ${notificacao.nome}, é a sua vez! Dirija-se ao guichê de atendimento.`;
    case "conferencia":
      return `Olá ${notificacao.nome}, dirija-se ao guichê para a conferência dos seus documentos de prioridade.`;
    case "chamada_novamente":
      return `Olá ${notificacao.nome}, sua senha está sendo chamada novamente. Dirija-se ao guichê de atendimento.`;
  }
}
