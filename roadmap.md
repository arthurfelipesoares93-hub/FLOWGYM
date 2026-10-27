# Roadmap — finalização da plataforma Forja

## Concluído antes
- Banco: profiles, students, assessments, fotos, treinos (versões/sessões/exercícios), treinos realizados, planos, cobranças, pagamentos, recibos, notificações, auditoria + RPCs e RLS.
- Fundações: landing, auth, reset de senha, shell, componentes compartilhados (avaliação, fotos, treino, desempenho), geração de treino por IA (server fn).

## Em aberto
1. Promover conta do Arthur (arthurfelipesoares93@gmail.com) a treinador (make_admin) — bloqueio: nenhum; fazer agora.
2. Área do treinador: layout /admin + painel (visão geral dos alunos), página do aluno (ficha, plano, financeiro, treinos/revisão, fotos, bloqueio), configurações (nome, código de convite, instruções de pagamento), notificações.
3. Área do aluno: layout /aluno + início, ficha de avaliação (formulário completo), treino atual + registro de sessão (cargas), evolução, financeiro (plano, cobranças, recibos), fotos (upload + consentimento), conta (consentimentos, vincular código, excluir conta).
4. Dados de demonstração: 1 aluno de exemplo com ficha, plano, cobrança e treino aprovado — para o Arthur ver tudo funcionando.
5. Testes: fluxos da seção 15 (cadastro, vínculo, ficha, geração IA, revisão, treino, financeiro) via Playwright; ajustar o que quebrar.
