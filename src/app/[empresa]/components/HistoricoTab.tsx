"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface HistoricoTabProps {
  empresaSlug: string;
}

interface Agendamento {
  id: number;
  nomeCliente: string;
  servicoNome: string;
  funcionarioNome: string;
  data: string;
  horario: string;
  status: string;
}

export default function HistoricoTab({ empresaSlug: _empresaSlug }: HistoricoTabProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"cliente" | "barbeiro">("cliente");
  const [showRegister, setShowRegister] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginTelefone, setLoginTelefone] = useState("");
  const [loginSenha, setLoginSenha] = useState("");

  // Register fields
  const [regNome, setRegNome] = useState("");
  const [regTelefone, setRegTelefone] = useState("");
  const [regSenha, setRegSenha] = useState("");
  const [regConfirmSenha, setRegConfirmSenha] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("agenda_token");
    const role = localStorage.getItem("agenda_role");
    if (token) {
      if (role === "barbeiro") setUserRole("barbeiro");
      setIsLoggedIn(true);
      fetchHistorico(token);
    }
  }, []);

  /** Atualiza a lista para sumir cancelados após o período server-side (~5 min) sem piscar o loading */
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem("agenda_token");
    if (!token) return;
    const id = window.setInterval(() => {
      fetchHistorico(token, { silent: true });
    }, 45_000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function fetchHistorico(token: string, opts?: { silent?: boolean }) {
    const silent = opts?.silent === true;
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/cliente/historico", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgendamentos(data.agendamentos || data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleLogin() {
    if (!loginTelefone.trim() || !loginSenha.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Preencha todos os campos.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefone: loginTelefone.replace(/\D/g, ""),
          senha: loginSenha,
        }),
      });

      if (res.status === 404) {
        setRegTelefone(loginTelefone);
        setShowRegister(true);
        return;
      }

      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Telefone ou senha incorretos.",
          background: "#1a1a1a",
          color: "#fdfdfd",
          confirmButtonColor: "#19d18e",
        });
        return;
      }

      const data = await res.json();
      localStorage.setItem("agenda_token", data.token);
      const role = data?.cliente?.role === "barbeiro" ? "barbeiro" : "cliente";
      localStorage.setItem("agenda_role", role);
      setUserRole(role);
      setIsLoggedIn(true);
      fetchHistorico(data.token);
    } catch (err) {
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!regNome.trim() || !regTelefone.trim() || !regSenha.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Preencha todos os campos.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });
      return;
    }

    if (regSenha !== regConfirmSenha) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "As senhas não coincidem.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: regNome,
          telefone: regTelefone.replace(/\D/g, ""),
          senha: regSenha,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: err.message || "Erro ao cadastrar.",
          background: "#1a1a1a",
          color: "#fdfdfd",
          confirmButtonColor: "#19d18e",
        });
        return;
      }

      const data = await res.json();
      localStorage.setItem("agenda_token", data.token);
      localStorage.setItem("agenda_role", "cliente");
      setUserRole("cliente");
      setIsLoggedIn(true);
      setShowRegister(false);
      fetchHistorico(data.token);
    } catch (err) {
      console.error("Erro no cadastro:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("agenda_token");
    localStorage.removeItem("agenda_role");
    setIsLoggedIn(false);
    setUserRole("cliente");
    setAgendamentos([]);
  }

  async function handleCancelar(id: number) {
    const result = await Swal.fire({
      title: "Cancelar agendamento?",
      text: "Esta ação não pode ser desfeita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f12e6a",
      cancelButtonColor: "#343434",
      confirmButtonText: "Sim, cancelar",
      cancelButtonText: "Não",
      background: "#1a1a1a",
      color: "#fdfdfd",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("agenda_token");
      const res = await fetch(`/api/agendamento/${id}/cancelar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Cancelado",
          text: "Agendamento cancelado com sucesso.",
          background: "#1a1a1a",
          color: "#fdfdfd",
          confirmButtonColor: "#19d18e",
        });
        fetchHistorico(token!);
      }
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    }
  }

  async function handleRemarcar(id: number) {
    const result = await Swal.fire({
      title: "Remarcar agendamento",
      html: `
        <input id="swal-data" type="date" class="swal2-input" />
        <input id="swal-hora" type="time" class="swal2-input" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      background: "#1a1a1a",
      color: "#fdfdfd",
      confirmButtonColor: "#19d18e",
      preConfirm: () => {
        const data = (document.getElementById("swal-data") as HTMLInputElement)?.value;
        const hora = (document.getElementById("swal-hora") as HTMLInputElement)?.value;

        if (!data || !hora) {
          Swal.showValidationMessage("Preencha data e hora");
          return;
        }

        return { data, hora };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    try {
      const token = localStorage.getItem("agenda_token");
      const res = await fetch(`/api/agendamento/${id}/remarcar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(result.value),
      });

      if (!res.ok) {
        throw new Error("Erro ao remarcar");
      }

      Swal.fire({
        icon: "success",
        title: "Remarcado",
        text: "Agendamento remarcado com sucesso.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });
      fetchHistorico(token!);
    } catch (err) {
      console.error("Erro ao remarcar:", err);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível remarcar.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });
    }
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      confirmado: { bg: "bg-[#19d18e]/20", text: "text-[#19d18e]", label: "Confirmado" },
      pendente: { bg: "bg-[#efaf4f]/20", text: "text-[#efaf4f]", label: "Pendente" },
      cancelado: { bg: "bg-[#f12e6a]/20", text: "text-[#f12e6a]", label: "Cancelado" },
      concluido: { bg: "bg-[#4b4a4a]/30", text: "text-[#fdfdfd]", label: "Concluído" },
    };
    const s = statusMap[status.toLowerCase()] || statusMap.pendente;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text} font-medium`}>
        {s.label}
      </span>
    );
  }

  function formatDateBR(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }

  // Login form
  if (!isLoggedIn && !showRegister) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm">
          <h2 className="text-center text-lg font-semibold mb-6 text-[#fdfdfd]">
            Entrar
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#4b4a4a] mb-1 block">Telefone</label>
              <input
                type="tel"
                value={loginTelefone}
                onChange={(e) => setLoginTelefone(formatPhone(e.target.value))}
                placeholder="(XX)XXXXX-XXXX"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
              />
            </div>
            <div>
              <label className="text-xs text-[#4b4a4a] mb-1 block">Senha</label>
              <input
                type="password"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#19d18e] text-black font-bold uppercase py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Register form
  if (!isLoggedIn && showRegister) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm">
          <h2 className="text-center text-lg font-semibold mb-2 text-[#fdfdfd]">
            Criar Conta
          </h2>
          <p className="text-center text-xs text-[#4b4a4a] mb-6">
            Telefone não encontrado. Cadastre-se:
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#4b4a4a] mb-1 block">Nome</label>
              <input
                type="text"
                value={regNome}
                onChange={(e) => setRegNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
              />
            </div>
            <div>
              <label className="text-xs text-[#4b4a4a] mb-1 block">Telefone</label>
              <input
                type="tel"
                value={regTelefone}
                onChange={(e) => setRegTelefone(formatPhone(e.target.value))}
                placeholder="(XX)XXXXX-XXXX"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
              />
            </div>
            <div>
              <label className="text-xs text-[#4b4a4a] mb-1 block">Senha</label>
              <input
                type="password"
                value={regSenha}
                onChange={(e) => setRegSenha(e.target.value)}
                placeholder="Crie uma senha"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
              />
            </div>
            <div>
              <label className="text-xs text-[#4b4a4a] mb-1 block">Confirmar Senha</label>
              <input
                type="password"
                value={regConfirmSenha}
                onChange={(e) => setRegConfirmSenha(e.target.value)}
                placeholder="Confirme a senha"
                className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
              />
            </div>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-[#19d18e] text-black font-bold uppercase py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
            <button
              onClick={() => setShowRegister(false)}
              className="w-full text-sm text-[#4b4a4a] hover:text-[#19d18e] mt-2"
            >
              ← Voltar para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show historico
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#fdfdfd]">
          {userRole === "barbeiro" ? "Histórico da Barbearia" : "Meus Agendamentos"}
        </h2>
        <button
          onClick={handleLogout}
          className="text-xs text-[#f12e6a] hover:underline"
        >
          Sair
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#19d18e] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agendamentos.length === 0 ? (
        <p className="text-center text-[#4b4a4a] py-10">
          Nenhum agendamento encontrado
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {agendamentos.map((ag) => (
            <div
              key={ag.id}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-bold text-[#fdfdfd] uppercase">
                  {ag.servicoNome}
                </p>
                {getStatusBadge(ag.status)}
              </div>
              <p className="text-xs text-[#4b4a4a]">
                Cliente: {ag.nomeCliente}
              </p>
              <p className="text-xs text-[#4b4a4a]">
                {ag.funcionarioNome} - {formatDateBR(ag.data)} às {ag.horario}
              </p>
              {ag.status.toLowerCase() !== "cancelado" &&
                ag.status.toLowerCase() !== "concluido" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRemarcar(ag.id)}
                      className="flex-1 text-xs py-2 rounded-lg border border-[#efaf4f] text-[#efaf4f] hover:bg-[#efaf4f]/10 transition-colors"
                    >
                      Remarcar
                    </button>
                    <button
                      onClick={() => handleCancelar(ag.id)}
                      className="flex-1 text-xs py-2 rounded-lg border border-[#f12e6a] text-[#f12e6a] hover:bg-[#f12e6a]/10 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
