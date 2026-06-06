import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Channel, EscalationLevel, InvoiceStatus } from '../src/generated/prisma/client.js';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  // Clean previous seed data to make re-runs idempotent
  await prisma.contactAttempt.deleteMany();
  await prisma.agentLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();

  // ── Case 1 ─────────────────────────────────────────────────────────────
  // 2 days overdue, LEVEL_1, $3,000 — fresh case, no prior contact
  const client1 = await prisma.client.create({
    data: {
      companyName: 'Papelería Norte SA',
      contactEmail: 'pagos@papelerianorte.com',
      riskProfile: 'Buen historial de pago, primer retraso registrado.',
    },
  });
  await prisma.invoice.create({
    data: {
      clientId: client1.id,
      amount: 3000.0,
      issueDate: daysAgo(32),
      dueDate: daysAgo(2),
      status: InvoiceStatus.PENDING,
      escalationLevel: EscalationLevel.LEVEL_1,
      nextActionAt: new Date(),
    },
  });

  // ── Case 2 ─────────────────────────────────────────────────────────────
  // 12 days overdue, LEVEL_2, $15,000 — 1 email sent, never opened
  const client2 = await prisma.client.create({
    data: {
      companyName: 'Distribuidora Central MX',
      contactEmail: 'contabilidad@distcentral.mx',
      riskProfile: 'Pagos frecuentemente tardíos, responde a segundo contacto.',
    },
  });
  const invoice2 = await prisma.invoice.create({
    data: {
      clientId: client2.id,
      amount: 15000.0,
      issueDate: daysAgo(42),
      dueDate: daysAgo(12),
      status: InvoiceStatus.IN_PROGRESS,
      escalationLevel: EscalationLevel.LEVEL_2,
      nextActionAt: new Date(),
    },
  });
  await prisma.contactAttempt.create({
    data: {
      invoiceId: invoice2.id,
      channel: Channel.EMAIL,
      escalationLevel: EscalationLevel.LEVEL_1,
      subject: 'Recordatorio de pago — Factura vencida',
      body: 'Estimado equipo de Distribuidora Central MX, le recordamos que su factura por $15,000 MXN venció hace 2 días. Agradecemos su pronto pago.',
      sentAt: daysAgo(10),
      delivered: true,
      opened: false, // never opened — trigger for LEVEL_2 escalation
      responded: false,
    },
  });

  // ── Case 3 ─────────────────────────────────────────────────────────────
  // 25 days overdue, LEVEL_3, $30,000 — 3 attempts, no response
  const client3 = await prisma.client.create({
    data: {
      companyName: 'Grupo Textil Occidente',
      contactEmail: 'finanzas@textiloccidente.com',
      contactPhone: '+5213312345678',
      riskProfile: 'Historial de litigios. Requiere tono formal y evidencia escrita.',
    },
  });
  const invoice3 = await prisma.invoice.create({
    data: {
      clientId: client3.id,
      amount: 30000.0,
      issueDate: daysAgo(55),
      dueDate: daysAgo(25),
      status: InvoiceStatus.IN_PROGRESS,
      escalationLevel: EscalationLevel.LEVEL_3,
      nextActionAt: new Date(),
    },
  });
  await prisma.contactAttempt.createMany({
    data: [
      {
        invoiceId: invoice3.id,
        channel: Channel.EMAIL,
        escalationLevel: EscalationLevel.LEVEL_1,
        subject: 'Recordatorio de pago — Factura vencida',
        body: 'Le recordamos su factura por $30,000 MXN. Agradecemos su atención.',
        sentAt: daysAgo(23),
        delivered: true,
        opened: true,
        responded: false,
      },
      {
        invoiceId: invoice3.id,
        channel: Channel.EMAIL,
        escalationLevel: EscalationLevel.LEVEL_2,
        subject: 'Segundo aviso — Pago pendiente urgente',
        body: 'Su factura por $30,000 MXN lleva 15 días vencida. Requerimos confirmación de pago en 48 horas.',
        sentAt: daysAgo(15),
        delivered: true,
        opened: true,
        responded: false,
      },
      {
        invoiceId: invoice3.id,
        channel: Channel.EMAIL,
        escalationLevel: EscalationLevel.LEVEL_3,
        subject: 'Aviso formal — Adeudo en gestión de cobranza',
        body: 'De no recibir pago en 72 horas, procederemos con gestión formal de cobranza por $30,000 MXN.',
        sentAt: daysAgo(5),
        delivered: true,
        opened: false,
        responded: false,
      },
    ],
  });

  // ── Case 4 ─────────────────────────────────────────────────────────────
  // 9 days overdue, LEVEL_2, $80,000 — AMBIGUITY: high amount at borderline level
  // Agent must reason carefully: LEVEL_2 rules apply but amount approaches $50k threshold
  const client4 = await prisma.client.create({
    data: {
      companyName: 'Importaciones del Pacífico',
      contactEmail: 'cxp@importpacífico.com',
      riskProfile:
        'Cliente nuevo, primer ciclo de crédito. Sin historial previo. Monto alto justifica cautela.',
    },
  });
  await prisma.invoice.create({
    data: {
      clientId: client4.id,
      amount: 80000.0,
      issueDate: daysAgo(39),
      dueDate: daysAgo(9),
      status: InvoiceStatus.IN_PROGRESS,
      escalationLevel: EscalationLevel.LEVEL_2,
      nextActionAt: new Date(),
    },
  });

  // ── Case 5 ─────────────────────────────────────────────────────────────
  // 30 days overdue, $120,000 — must escalate to human (amount > $50,000 rule)
  const client5 = await prisma.client.create({
    data: {
      companyName: 'Constructora Noreste',
      contactEmail: 'tesoreria@constructoranoreste.mx',
      contactPhone: '+5218112345678',
      riskProfile:
        'Empresa grande con ciclos de pago lentos. Monto supera $50,000 — requiere gestor humano.',
    },
  });
  await prisma.invoice.create({
    data: {
      clientId: client5.id,
      amount: 120000.0,
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      status: InvoiceStatus.ESCALATED_HUMAN,
      escalationLevel: EscalationLevel.LEVEL_3,
      nextActionAt: null, // no automated action — handed to human
    },
  });

  console.log('Seed complete: 5 escalation test cases inserted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
