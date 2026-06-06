# DebtFlow AI

Agente autónomo de cobranza B2B. Contexto completo en docs/context.md.

## Stack
- Backend: Node.js + Express
- DB: PostgreSQL + Prisma
- Frontend: Next.js + TailwindCSS
- AI: Por definir (Haiku 4.5 candidato principal)
- Mensajería: WhatsApp Business API vía Twilio + Resend
- Pagos: Stripe + Kushki

## Comandos
- Instalar: `npm install`
- Dev: `npm run dev`
- Tests: `npm test`
- Lint: `npm run lint`
- Migración DB: `npx prisma migrate dev`
- Build: `npm run build`

## Reglas SOLID — obligatorio antes de codificar
Antes de escribir cualquier código, responder explícitamente:
1. ¿Aplica algún principio SOLID? → nombrarlo
2. ¿Hay un patrón de diseño que encaje? → nombrarlo y explicar por qué

Patrones prioritarios:
- Strategy → selección de canal (email vs WhatsApp)
- Chain of Responsibility → niveles de escalación 1, 2, 3
- Observer → factura cambia estado → notifica dashboard + logs + CFO
- Decorator → tools del agente envueltos con logging y error handling
- Factory → creación de tool correcto según canal

## Reglas de escalación
- Nivel 1 (días 1-7): email primero, tono amigable, nunca consecuencias
- Nivel 2 (días 8-21): WhatsApp si email no abierto, tono directo
- Nivel 3 (días 22+): formal, escalar a humano si monto > $50,000

## Los 6 tools
send_email | send_whatsapp | get_invoice_data | update_status | schedule_followup | escalate_to_human

## Al iniciar cada sesión
1. Leer CLAUDE.md y docs/context.md
2. Reportar brevemente en qué fase estamos y qué sigue
3. Proponer el siguiente paso antes de ejecutar
4. Esperar aprobación antes de codificar

## Compact instructions
Al resumir esta conversación preservar siempre:
- Decisiones de arquitectura tomadas y su razón
- Estado actual de cada fase del roadmap
- Errores encontrados y cómo se resolvieron
- Lista de archivos modificados en la sesión