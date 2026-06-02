import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.agendamento.deleteMany();
  await prisma.disponibilidade.deleteMany();
  await prisma.funcionario.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.unidade.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.empresa.deleteMany();

  const empresa = await prisma.empresa.create({
    data: {
      slug: "barbearia-do-roni",
      nome: "Barbearia do Roni",
      logoUrl: null,
      // Troque pelo WhatsApp real do estabelecimento (DDI 55 + DDD + número, só dígitos)
      whatsappNotificacoes: "5573999999999",
    },
  });

  const unidade = await prisma.unidade.create({
    data: { empresaId: empresa.id, nome: "Arraial d'Ajuda" },
  });

  const servicos = [
    { nome: "CORTE SOCIAL", preco: 25.0, duracaoMin: 30 },
    { nome: "CORTE DEGRADÊ", preco: 35.0, duracaoMin: 30 },
    { nome: "CORTE + BARBA", preco: 50.0, duracaoMin: 40 },
    { nome: "BARBA", preco: 25.0, duracaoMin: 30 },
    { nome: "CORTE + PIGMENTAÇÃO", preco: 70.0, duracaoMin: 60 },
    { nome: "NEVOU", preco: 150.0, duracaoMin: 120 },
    { nome: "LUZES", preco: 130.0, duracaoMin: 90 },
    { nome: "DESCOLORIR O BIGODE", preco: 20.0, duracaoMin: 15 },
    { nome: "PEZINHO", preco: 20.0, duracaoMin: null },
  ];

  for (const s of servicos) {
    await prisma.servico.create({
      data: { unidadeId: unidade.id, ...s },
    });
  }

  const roni = await prisma.funcionario.create({
    data: {
      unidadeId: unidade.id,
      nome: "Roni",
      fotoUrl: "/funcionarios/roni.png",
    },
  });

  for (let dia = 1; dia <= 6; dia++) {
    await prisma.disponibilidade.create({
      data: {
        funcionarioId: roni.id,
        diaSemana: dia,
        horaInicio: "08:30",
        horaFim: "12:30",
      },
    });
    await prisma.disponibilidade.create({
      data: {
        funcionarioId: roni.id,
        diaSemana: dia,
        horaInicio: "13:30",
        horaFim: "20:00",
      },
    });
  }

  const senhaHash = await bcrypt.hash("123456", 10);
  await prisma.cliente.create({
    data: {
      nome: "Cliente Teste",
      telefone: "11999999999",
      senhaHash,
    },
  });

  console.log("Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
