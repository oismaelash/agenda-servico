import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const body = await request.json();
  const { nome, telefone, senha } = body;

  if (!nome || !telefone || !senha) {
    return NextResponse.json(
      { error: "nome, telefone e senha são obrigatórios" },
      { status: 400 }
    );
  }

  const existing = await prisma.cliente.findUnique({
    where: { telefone },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Telefone já cadastrado" },
      { status: 409 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const cliente = await prisma.cliente.create({
    data: { nome, telefone, senhaHash },
  });

  const token = jwt.sign(
    { clienteId: cliente.id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return NextResponse.json(
    {
      token,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
      },
    },
    { status: 201 }
  );
}
