# 🏥 Visão Geral do Projeto: Fila Fácil

## 1. Informações do Projeto
- **Nome:** Fila Fácil - Sistema de Senhas para UBS e Clínicas
- **Versão:** 1.0 (Protótipo para Extensão Universitária)
- **Curso:** Sistemas de Informação (6° Semestre)
- **Tema:** Cidades Inteligentes e Prototipagem de Soluções
- **Objetivo Principal:** Organizar a ordem de atendimento do dia, substituindo senhas físicas por senhas virtuais acessíveis via navegador web.

## 2. Justificativa e Impacto Social
Salas de espera lotadas em UBS e clínicas geram desconforto, risco de contágio de doenças respiratórias e perda de tempo útil para o cidadão. O projeto visa aplicar o conceito de "Cidades Inteligentes" em microescala, permitindo que o paciente aguarde seu atendimento em locais abertos, na própria residência (se próxima) ou no comércio local, retornando à unidade de saúde apenas no momento exato do seu atendimento.

## 3. Público-Alvo e Cenário
Desenvolvido para Unidades Básicas de Saúde (UBS), clínicas, laboratórios e farmácias. 
O cenário ideal de uso é: o paciente chega, lê um QR Code físico colado na parede com seu celular, preenche um formulário simples e recebe uma senha virtual. Ele pode aguardar em um local externo e será avisado pelo WhatsApp quando sua vez estiver chegando.

## 4. Atores e Funcionalidades

### 👤 Para o Paciente
- **Retirada de Senha:** Acesso via navegador web (sem necessidade de download de app).
- **Acompanhamento em Tempo Real:** Tela que exibe a posição atual na fila.
- **Notificação Antecipada:** Recebimento de alerta automático no WhatsApp (Regra: O alerta é disparado quando faltarem exatamente 3 pessoas na frente).
- **Pesquisa de Satisfação (Opcional):** Link enviado junto com a mensagem de finalização do atendimento para avaliar o sistema.

### 👩‍💻 Para a Recepção (Equipe)
- **Login Restrito:** Acesso ao painel protegido por usuário e senha.
- **Dashboard de Gestão:** Painel web exibindo a fila do dia em tempo real.
- **Controle de Fluxo:** Botões de ação rápida para:
  - `Chamar Próximo` (Avança a fila e aciona o gatilho de notificação).
  - `Marcar Ausente` (Pula o paciente que não compareceu).
  - `Finalizar` (Encerra o atendimento atual).
- **Histórico do Dia (Opcional):** Visualização de quantos pacientes foram atendidos na data atual.

## 5. Dados do Cadastro (Formulário do Paciente)
- Nome Completo (Obrigatório)
- CPF (Obrigatório)
- Telefone/WhatsApp (Obrigatório - deve ser higienizado no backend)
- Tipo de Atendimento (Obrigatório - ex: Clínico Geral, Dentista)
- Motivo (Obrigatório - texto livre)

## 6. Requisitos Não Funcionais (Arquitetura e Qualidade)
- **Desempenho:** A atualização da tela da recepção e do paciente deve ocorrer instantaneamente sem necessidade de recarregar a página (WebSockets).
- **Disponibilidade:** O processamento de envio de mensagens no WhatsApp não pode bloquear as requisições HTTP da API (Uso de mensageria assíncrona).
- **Segurança:** O painel da recepção deve estar protegido contra acessos não autorizados via token JWT. Nenhuma rota de alteração de status pode ser pública.

## 7. Escopo e Limites do Sistema
- ✅ **FAZ:** Geração de senhas apenas para o dia atual (ordem de chegada).
- ✅ **FAZ:** Fila em tempo real via WebSockets.
- ✅ **FAZ:** Autenticação JWT apenas para a equipe da recepção.
- ❌ **NÃO FAZ:** Agendamento prévio para dias futuros.
- ❌ **NÃO FAZ:** Sistema de Login/Autenticação para pacientes.
- ❌ **NÃO FAZ:** Integração com sistemas de saúde externos (SUS, prontuários eletrônicos).