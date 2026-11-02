# ADR-006: Envio de E-mails com MailerSend

## Status
Aceita

## Data
04/10/2026

## Contexto
A EasyFood precisa notificar o usuário por e-mail quando um restaurante é cadastrado. É necessário um provedor de e-mail transacional simples de integrar e com plano gratuito para desenvolvimento.

## Alternativas Consideradas
1. **Nodemailer + SMTP próprio**: sem dependência de terceiros, mas exige configurar servidor SMTP, SPF/DKIM e lida mal com entregabilidade.
2. **SendGrid / Amazon SES**: robustos, porém com configuração e custos maiores para o estágio atual.
3. **MailerSend**: API HTTP simples, SDK oficial para Node.js, domínio de teste gratuito (sandbox).

## Decisão
Adotar o **MailerSend** por meio de um serviço compartilhado em `src/lib/email.service.js`, que expõe `sendEmail({ to, toName, subject, header, body, footer })` e `buildHtml()`, chamado em `restaurantService.js`.

## Justificativa
- SDK oficial e API simples.
- Camada de serviço isola o provedor: trocar de fornecedor altera um único arquivo.
- Credenciais em variáveis de ambiente (`MAILERSEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`), nunca no código.
- O envio é feito em `try/catch` no `restaurant.service.js`: falha de e-mail não impede o cadastro.

## Consequências
### Positivas
- Notificações automáticas ao usuário; código de e-mail reutilizável por outros módulos.
### Negativas / Trade-offs
- Dependência de serviço externo e de rede.
- No modo **sandbox**, o domínio de teste só envia para o e-mail do dono da conta e tem limites diários baixos.
- Envio síncrono adiciona latência; no futuro, usar fila/envio assíncrono.

## Critérios de Revisão
Reavaliar se o volume ultrapassar o plano gratuito, ou se for necessário domínio próprio verificado (SPF/DKIM) para enviar a qualquer destinatário.
