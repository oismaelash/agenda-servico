import { prisma } from "@/lib/prisma";

export default async function EmpresaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { empresa: string };
}) {
  const empresa = await prisma.empresa.findUnique({
    where: { slug: params.empresa },
  });
  const tituloCabecalho = empresa?.nome ?? "Barbearia do Roni";

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Top Navbar */}
      <header className="w-full bg-[#0d1b2a] py-4 px-4 flex items-center justify-center border-b border-white/10">
        <h1 className="text-[#19d18e] font-mono text-xl font-bold tracking-wider">
          {tituloCabecalho}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
    </div>
  );
}
