"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AgendamentoModal from "./components/AgendamentoModal";
import HistoricoTab from "./components/HistoricoTab";

interface Unidade {
  id: number;
  nome: string;
}

interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracaoMin?: number | null;
}

export default function EmpresaPage() {
  const params = useParams();
  const empresaSlug = params.empresa as string;

  const [activeTab, setActiveTab] = useState<"agendar" | "historico">("agendar");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<number | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServicos, setLoadingServicos] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);

  useEffect(() => {
    fetchUnidades();
  }, [empresaSlug]);

  useEffect(() => {
    if (selectedUnidade) {
      fetchServicos(selectedUnidade);
    }
  }, [selectedUnidade]);

  async function fetchUnidades() {
    try {
      setLoading(true);
      const res = await fetch(`/api/${empresaSlug}/unidades`);
      const data = await res.json();
      const list: Unidade[] = data.unidades || data;

      setUnidades(list);

      if (list.length === 1) {
        setSelectedUnidade(list[0].id);
      }
    } catch (err) {
      console.error("Erro ao buscar unidades:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchServicos(unidadeId: number) {
    try {
      setLoadingServicos(true);
      const res = await fetch(`/api/${empresaSlug}/${unidadeId}/servicos`);
      const data = await res.json();
      setServicos(data.servicos || data);
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
    } finally {
      setLoadingServicos(false);
    }
  }

  function handleSelectUnidade(id: number) {
    setSelectedUnidade(id);
  }

  function handleSelectServico(servico: Servico) {
    setSelectedServico(servico);
    setModalOpen(true);
  }

  function formatPrice(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function renderAgendarContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#19d18e] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // Show unidades selection if multiple and none selected
    if (unidades.length > 1 && !selectedUnidade) {
      return (
        <div className="p-4">
          <h2 className="text-center text-lg font-semibold mb-6 text-[#fdfdfd]">
            Selecione a unidade
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {unidades.map((unidade) => (
              <button
                key={unidade.id}
                onClick={() => handleSelectUnidade(unidade.id)}
                className="w-28 h-28 rounded-full bg-[#1a1a1a] border border-white/20 flex items-center justify-center text-center text-sm font-medium text-[#fdfdfd] hover:border-[#19d18e] hover:scale-105 transition-all duration-200"
              >
                {unidade.nome}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Show services
    if (loadingServicos) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#19d18e] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="p-4">
        {unidades.length > 1 && (
          <button
            onClick={() => setSelectedUnidade(null)}
            className="mb-4 text-sm text-[#19d18e] hover:underline"
          >
            ← Voltar para unidades
          </button>
        )}
        <h2 className="text-center text-lg font-semibold mb-4 text-[#fdfdfd]">
          Serviços
        </h2>
        <div className="flex flex-col gap-3">
          {servicos.map((servico) => (
            <button
              key={servico.id}
              onClick={() => handleSelectServico(servico)}
              className="w-full bg-[#1a1a1a] border border-white/20 rounded-xl p-4 text-left hover:border-[#19d18e] hover:scale-[1.02] transition-all duration-200"
            >
              <p className="text-[#fdfdfd] font-bold uppercase text-sm">
                {servico.nome}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#19d18e] font-semibold">
                  {formatPrice(servico.preco)}
                </span>
                {servico.duracaoMin && (
                  <span className="text-[#4b4a4a] text-xs">
                    {servico.duracaoMin} min
                  </span>
                )}
              </div>
            </button>
          ))}
          {servicos.length === 0 && (
            <p className="text-center text-[#4b4a4a] py-10">
              Nenhum serviço disponível
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "agendar" ? renderAgendarContent() : <HistoricoTab empresaSlug={empresaSlug} />}
      </div>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center bg-[#1a1a1a] border border-white/20 rounded-full px-2 py-2 gap-1">
          <button
            onClick={() => setActiveTab("agendar")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "agendar"
                ? "bg-[#19d18e] text-black"
                : "text-[#fdfdfd] hover:text-[#19d18e]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Agendar
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "historico"
                ? "bg-[#19d18e] text-black"
                : "text-[#fdfdfd] hover:text-[#19d18e]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Histórico
          </button>
        </div>
      </nav>

      {/* Agendamento Modal */}
      {modalOpen && selectedServico && selectedUnidade && (
        <AgendamentoModal
          servicoId={selectedServico.id}
          servicoNome={selectedServico.nome}
          empresaSlug={empresaSlug}
          unidadeId={selectedUnidade}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
