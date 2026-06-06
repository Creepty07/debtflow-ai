# DebtFlow AI — Contexto del Proyecto

> Este archivo es el contexto maestro del proyecto. Debe mantenerse actualizado conforme avance el desarrollo. La IA debe leerlo al inicio de cada sesión para saber en qué punto está el proyecto.

---

## ¿Qué es DebtFlow AI?

Agente autónomo de cobranza B2B para PYMEs que venden a crédito. El sistema detecta facturas vencidas, decide qué canal usar (email o WhatsApp), redacta mensajes personalizados y escala el tono de forma gradual — sin intervención humana. Cuando un caso supera sus límites, escala a una persona.

**Problema que resuelve:** El 60–80% de las PYMEs B2B tiene más del 10% de su facturación en cartera vencida. La solución actual es Excel + correos manuales + llamadas incómodas. DebtFlow automatiza ese proceso completo.

**Mercado objetivo:** PYMEs B2B de 10–500 empleados en LatAm.  
**Precio:** $199–$1,200+/mes (más modelo variable: 1.5% de cartera recuperada, opcional).

---

## Stack Tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend / Dashboard | Next.js + TailwindCSS | Permite SSR, rutas de API integradas y despliegue sencillo |
| Backend / Orchestrator | Node.js + Express | Manejo asíncrono nativo, ideal para loops de agente con múltiples llamadas concurrentes |
| Base de datos | PostgreSQL | Relacional, confiable para historial de facturas y logs de auditoría |
| ORM | Prisma o Drizzle | Abstracción de DB con tipado fuerte; decisión pendiente |
| Mensajería WhatsApp | WhatsApp Business API (vía Twilio o Meta directo) | Canal principal de cobranza en LatAm |
| Email | Resend | Tracking de apertura y entrega nativo, API simple |
| Pagos | Stripe + Kushki | Stripe para mercados globales, Kushki para LatAm local |
| Infraestructura inicial | Railway o Render | Bajo costo, despliegue simple para MVP |
| **Modelo de IA** | **POR DEFINIR** | Ver sección "Evaluación de Modelos de IA" |

---

## Arquitectura del Agente

### La fórmula base
```
Agente = LLM + Contexto/Memoria + Herramientas (Tools) + Loop de Ejecución
```

### El Loop de Razonamiento (Agentic Loop)
El agente no espera instrucciones. Opera en un ciclo continuo:

1. **OBSERVAR** — Recibe el estado actual: datos de la factura, días vencidos, historial de intentos, canal previo, monto, perfil del deudor.
2. **RAZONAR** — El LLM analiza el contexto y decide: qué canal usar, qué tono aplicar, si escalar o esperar.
3. **USAR TOOL** — Llama a una función real del código (send_whatsapp, send_email, etc.).
4. **VER RESULTADO** — Recibe la respuesta de la función y la registra en la base de datos.
5. **DECIDIR** — ¿Tarea completa o continuar? Cierra el ciclo o programa la siguiente acción.

### Disparador automático
Un **cron job** corre cada hora consultando facturas donde `next_action_at <= NOW()`. Para cada una, activa el agente. Esto es lo que hace el sistema 24/7 sin intervención humana.

---

## Los 6 Tools del Agente

Estas son las funciones reales que el agente puede invocar. El LLM decide cuándo y con qué parámetros llamarlas.

| Tool | Qué hace |
|------|----------|
| `send_email(to, subject, body)` | Envía email de cobranza con tracking de apertura |
| `send_whatsapp(phone, message)` | Envía mensaje por WhatsApp Business API |
| `get_invoice_data(id)` | Consulta la DB: monto, días vencidos, historial de intentos |
| `update_status(id, status, notes)` | Actualiza el estado de la factura y escribe notas de auditoría |
| `schedule_followup(id, days)` | Agenda el próximo contacto automático |
| `escalate_to_human(id, reason)` | Escala a un humano cuando el caso supera los límites del agente |

---

## Reglas de Escalación

El agente aplica uno de tres niveles según los días vencidos, el historial y el monto.

### Nivel 1 — Días 1–7 (Amigable)
- Asume que fue un olvido. Tono cálido.
- Canal: email primero. WhatsApp solo si el email no fue abierto.
- **Nunca** mencionar consecuencias ni acciones legales.
- Incluir link de pago directo.

### Nivel 2 — Días 8–21 (Directo)
- Tono profesional. Menciona el impacto en la relación comercial.
- Canal: WhatsApp si el email no fue abierto en 48h.
- Proponer plan de pago si hay señal de dificultad real.
- Mayor frecuencia de seguimiento.

### Nivel 3 — Días 22+ (Formal)
- Tono formal. Menciona que se tomarán acciones adicionales.
- Escalar a humano si el monto supera $50,000.
- Ofrecer portal de negociación al deudor.
- Reporte inmediato al CFO del cliente.

---

## Principios de Desarrollo — SOLID y Patrones de Diseño

### Regla obligatoria antes de codificar
Antes de escribir cualquier fragmento de código, responder explícitamente:
1. ¿Puedo aplicar algún principio SOLID aquí?
2. ¿Hay algún patrón de diseño que encaje con este problema?

Si la respuesta es sí: nombrar el patrón, explicar en una línea por qué aplica en este contexto de DebtFlow, y escribir el código siguiendo ese patrón. Si no aplica ninguno, explicar brevemente por qué.

### Principios SOLID

| Principio | Descripción | Ejemplo en DebtFlow |
|-----------|-------------|---------------------|
| **S** — Single Responsibility | Cada clase o módulo hace una sola cosa | `EmailSender` solo envía emails, no decide cuándo enviarlos |
| **O** — Open/Closed | Abierto para extender, cerrado para modificar | Añadir un canal nuevo (Telegram) sin tocar el código existente |
| **L** — Liskov Substitution | Las subclases deben poder reemplazar a sus padres | `WhatsAppSender` y `EmailSender` son intercambiables donde se usa `MessageSender` |
| **I** — Interface Segregation | Interfaces pequeñas y específicas, no generales | Separar `IMessageSender` de `IMessageLogger` |
| **D** — Dependency Inversion | Depender de abstracciones, no de implementaciones concretas | El orchestrator depende de `ILLMProvider`, no de `ClaudeClient` directamente |

### Patrones de diseño — cuándo aplican en DebtFlow

| Patrón | Cuándo usarlo | Ejemplo concreto en DebtFlow |
|--------|--------------|------------------------------|
| **Strategy** | Múltiples formas de hacer algo intercambiables | Elegir canal de envío (email vs WhatsApp) según el contexto |
| **Chain of Responsibility** | Una petición pasa por múltiples manejadores en orden | Los 3 niveles de escalación — cada nivel decide si maneja o pasa al siguiente |
| **Observer** | Un evento debe notificar a múltiples partes | Factura marcada como pagada → notificar dashboard, logs, CFO |
| **Builder** | Construir objetos complejos paso a paso | Construir el mensaje de cobranza con contexto, tono y canal |
| **Singleton** | Solo debe existir una instancia | Cliente de base de datos, cliente de LLM API |
| **Decorator** | Añadir comportamiento sin modificar la clase original | Envolver tools con logging, manejo de errores y métricas |
| **Factory** | Creación de objetos varía según condiciones | Crear el tool correcto según el canal elegido por el agente |

### Patrones más relevantes para DebtFlow (prioridad alta)
- **Strategy** — aparecerá en la selección de canal y en la lógica de mensajes por nivel
- **Chain of Responsibility** — es el patrón natural de los 3 niveles de escalación
- **Observer** — cuando una factura cambia de estado y múltiples sistemas reaccionan
- **Decorator** — para envolver los tools con logging y error handling sin tocar su lógica

---

## Organización de Respuestas

Toda respuesta que involucre código o implementación debe:
1. Organizarse en **pasos numerados y secuenciales**
2. Cada paso debe ser **atómico** — completable de forma independiente
3. Incluir siempre: qué hace, por qué esta opción y no otras, qué problema resuelve en DebtFlow
4. Definir cualquier término técnico en la misma respuesta
5. Mencionar brevemente el estado del proyecto antes de continuar con código

---

## Evaluación de Modelos de IA

**Decisión pendiente.** Se han evaluado los siguientes modelos con el mismo prompt de cobranza B2B (5 casos de prueba con reglas de escalación, tool use y JSON estructurado):

| Modelo | TTFT | TPS | Costo input/M | Resultado de prueba |
|--------|------|-----|----------------|---------------------|
| Nvidia Nemotron 550B | 404s | 12 | Variable | ❌ DESCARTADO — JSON malformado, casos omitidos, alucinación de datos |
| Gemini 2.5 Flash-Lite | 0.29s | 393 | $0.10 | ⚠️ EN EVALUACIÓN — Muy rápido y barato, pero action completion score 0.67 es riesgo en producción |
| Gemini 2.5 Flash | 0.60s | 197 | $0.30 | ⚠️ EN EVALUACIÓN — Balance de velocidad y razonamiento, pendiente prueba con prompt completo |
| Claude Haiku 4.5 | 0.81s | 136 | $1.00 | ✅ CANDIDATO PRINCIPAL — Tool use nativo, JSON confiable, mismo proveedor que Sonnet para escalación |

**Criterios de decisión:**
- JSON siempre válido (sin `undefined`, sin anidamiento roto)
- Tool selection correcta en los 5 casos de prueba
- Manejo correcto del caso de ambigüedad (Caso 4)
- Latencia acceptable en producción (< 5s por factura)
- Costo viable con 500+ facturas diarias

**Pendiente:** Probar Gemini 2.5 Flash con el prompt completo. Considerar otros modelos no evaluados aún.

---

## Modelo de Pricing

| Plan | Precio | Límites |
|------|--------|---------|
| Starter | $199/mes | Hasta 100 facturas, solo email, 1 usuario |
| Growth | $499/mes | Facturas ilimitadas, email + WhatsApp, AI personalizado, 3 usuarios |
| Enterprise | $1,200+/mes | Multi-empresa, integraciones ERP, SLA, usuarios ilimitados |
| Variable (add-on) | 1.5% de monto recuperado | Sobre plan base, opcional |

---

## Roadmap

| Fase | Tiempo | Estado | Entregable |
|------|--------|--------|------------|
| Fase 1 — MVP Núcleo | Semanas 1–4 | ⬜ PENDIENTE | CSV → email → dashboard básico → primer cobro |
| Fase 2 — WhatsApp + AI | Semanas 5–10 | ⬜ PENDIENTE | WhatsApp API + LLM personalización + decisión de canal |
| Fase 3 — Integraciones ERP | Meses 3–5 | ⬜ PENDIENTE | SAP, Aspel, Contpaq, QuickBooks + score de riesgo |
| Fase 4 — Plataforma completa | Meses 6–12 | ⬜ PENDIENTE | Modelo variable + portal deudor + multi-empresa + API pública |
| Fase 5 — Expansión | Año 2–3 | ⬜ PENDIENTE | Colombia, Argentina, Perú, Chile + EE.UU. hispano + factoring |

---

## Estado Actual del Proyecto

### ✅ Completado
- Análisis estratégico de mercado y validación de oportunidad
- Definición del ICP, modelo de pricing y proyecciones financieras
- Arquitectura del agente (loop, tools, niveles de escalación)
- Evaluación parcial de modelos de IA
- Documento PDF y artefactos visuales del proyecto
- Definición del stack tecnológico base
- Instrucciones de desarrollo (SOLID + patrones de diseño)
- Archivo de contexto maestro del proyecto

### 🔄 En progreso
- Selección final del modelo de IA (pendiente prueba de Gemini 2.5 Flash)
- Configuración del proyecto en Claude (descripción, instrucciones, archivos)

### ⬜ Pendiente
- Configuración del repositorio y entorno de desarrollo
- Diseño del esquema de base de datos (tablas: invoices, clients, contact_attempts, agent_logs)
- Implementación del orchestrator (loop principal)
- Implementación de los 6 tools
- Integración WhatsApp Business API
- Integración Resend (email)
- Dashboard básico (Next.js)
- Sistema de autenticación
- Pruebas del agente en escenarios reales
- Estrategia GTM y primeros clientes

---

## Decisiones Técnicas Pendientes

- [ ] Modelo de IA definitivo (Claude Haiku 4.5 vs Gemini 2.5 Flash vs otro)
- [ ] ORM: Prisma vs Drizzle
- [ ] WhatsApp API: Twilio vs Meta Cloud API directo
- [ ] Infraestructura: Railway vs Render vs otro
- [ ] Estrategia de prompt caching para reducir costos en producción

---

*Última actualización: Junio 2026 — Fase de planificación y configuración del proyecto*
