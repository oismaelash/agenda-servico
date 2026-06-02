"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface AgendamentoModalProps {
  servicoId: number;
  servicoNome: string;
  empresaSlug: string;
  unidadeId: number;
  onClose: () => void;
}

interface Funcionario {
  id: number;
  nome: string;
  foto?: string;
  fotoUrl?: string | null;
}

interface DayOption {
  date: Date;
  label: string;
  dayName: string;
}

export default function AgendamentoModal({
  servicoId,
  servicoNome,
  empresaSlug,
  unidadeId,
  onClose,
}: AgendamentoModalProps) {
  const [step, setStep] = useState(1);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function getDays(): DayOption[] {
    const days: DayOption[] = [];
    const today = new Date();
    const startOffset = weekOffset * 8;

    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + startOffset + i);
      days.push({
        date,
        label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        dayName: dayNames[date.getDay()],
      });
    }
    return days;
  }

  function formatDateISO(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatDateBR(date: Date): string {
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  }

  useEffect(() => {
    if (selectedDay) {
      fetchFuncionarios();
    }
  }, [selectedDay]);

  useEffect(() => {
    if (selectedFuncionario && selectedDay) {
      fetchHorarios();
    }
  }, [selectedFuncionario, selectedDay, servicoId]);

  async function fetchFuncionarios() {
    if (!selectedDay) return;
    try {
      setLoadingFuncionarios(true);
      const dateStr = formatDateISO(selectedDay);
      const res = await fetch(
        `/api/${empresaSlug}/${unidadeId}/funcionarios?data=${dateStr}`
      );
      const data = await res.json();
      setFuncionarios(data.funcionarios || data);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
    } finally {
      setLoadingFuncionarios(false);
    }
  }

  async function fetchHorarios() {
    if (!selectedDay || !selectedFuncionario) return;
    try {
      setLoadingHorarios(true);
      const dateStr = formatDateISO(selectedDay);
      const res = await fetch(
        `/api/${empresaSlug}/${unidadeId}/horarios?servico_id=${servicoId}&funcionario_id=${selectedFuncionario.id}&data=${dateStr}`
      );
      const data = await res.json();
      setHorarios(data.horarios || data);
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
    } finally {
      setLoadingHorarios(false);
    }
  }

  function handleSelectDay(day: DayOption) {
    setSelectedDay(day.date);
    setSelectedFuncionario(null);
    setSelectedHorario(null);
    setStep(2);
  }

  function handleSelectFuncionario(func: Funcionario) {
    setSelectedFuncionario(func);
    setSelectedHorario(null);
    setStep(3);
  }

  function handleSelectHorario(horario: string) {
    setSelectedHorario(horario);
    setStep(4);
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    setTelefone(formatPhone(e.target.value));
  }

  async function handleSubmit() {
    if (!nome.trim() || !telefone.trim()) {
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
      setSubmitting(true);
      const res = await fetch("/api/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicoId,
          funcionarioId: selectedFuncionario?.id,
          data: formatDateISO(selectedDay!),
          hora: selectedHorario,
          nomeCliente: nome,
          telefone: telefone.replace(/\D/g, ""),
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao agendar");
      }

      await Swal.fire({
        icon: "success",
        title: "Agendado!",
        text: "Seu agendamento foi realizado com sucesso.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });

      onClose();
    } catch (_err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível realizar o agendamento. Tente novamente.",
        background: "#1a1a1a",
        color: "#fdfdfd",
        confirmButtonColor: "#19d18e",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/20 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-[#fdfdfd] font-semibold text-base uppercase">
            {servicoNome}
          </h3>
          <button
            onClick={onClose}
            className="text-[#4b4a4a] hover:text-[#fdfdfd] text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 py-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                s <= step ? "bg-[#19d18e]" : "bg-[#343434]"
              }`}
            />
          ))}
        </div>

        <div className="p-4">
          {/* Step 1: Select Day */}
          {step >= 1 && (
            <div className={step === 1 ? "" : "mb-4"}>
              <p className="text-sm text-[#4b4a4a] mb-3 font-medium">
                Selecione o dia:
              </p>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                  disabled={weekOffset === 0}
                  className="text-[#fdfdfd] disabled:text-[#343434] text-lg px-2"
                >
                  &lt;
                </button>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {getDays().map((day, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectDay(day)}
                      className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all ${
                        selectedDay && formatDateISO(selectedDay) === formatDateISO(day.date)
                          ? "bg-[#19d18e] text-black font-bold"
                          : "bg-[#1a1a1a] text-[#fdfdfd] border border-white/10 hover:border-[#19d18e]"
                      }`}
                    >
                      <span className="font-medium">{day.label}</span>
                      <span className="text-[10px] mt-0.5">{day.dayName}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  className="text-[#fdfdfd] text-lg px-2"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Professional */}
          {step >= 2 && (
            <div className={step === 2 ? "" : "mb-4"}>
              <p className="text-sm text-[#4b4a4a] mb-3 font-medium">
                Selecione o profissional:
              </p>
              {loadingFuncionarios ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#19d18e] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 justify-center">
                  {funcionarios.map((func) => (
                    <button
                      key={func.id}
                      onClick={() => handleSelectFuncionario(func)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                        selectedFuncionario?.id === func.id
                          ? "scale-105"
                          : "hover:scale-105"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                          selectedFuncionario?.id === func.id
                            ? "border-[#19d18e] bg-[#19d18e]/20 text-[#19d18e]"
                            : "border-white/20 bg-[#343434] text-[#fdfdfd]"
                        }`}
                      >
                        {func.fotoUrl || func.foto ? (
                          <img
                            src={(func.fotoUrl || func.foto) as string}
                            alt={func.nome}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(func.nome)
                        )}
                      </div>
                      <span className="text-xs text-[#fdfdfd] max-w-[70px] truncate">
                        {func.nome.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                  {funcionarios.length === 0 && (
                    <p className="text-[#4b4a4a] text-sm">
                      Nenhum profissional disponível
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Time */}
          {step >= 3 && (
            <div className={step === 3 ? "" : "mb-4"}>
              <p className="text-sm text-[#4b4a4a] mb-3 font-medium">
                Selecione o horário:
              </p>
              {loadingHorarios ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-[#19d18e] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {horarios.map((horario) => (
                    <button
                      key={horario}
                      onClick={() => handleSelectHorario(horario)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedHorario === horario
                          ? "bg-[#19d18e] text-black"
                          : "bg-[#1a1a1a] text-[#fdfdfd] border border-white/10 hover:border-[#19d18e]"
                      }`}
                    >
                      {horario}
                    </button>
                  ))}
                  {horarios.length === 0 && (
                    <p className="col-span-4 text-center text-[#4b4a4a] text-sm py-2">
                      Nenhum horário disponível
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div>
              <p className="text-sm text-[#4b4a4a] mb-3 font-medium">
                Resumo:
              </p>
              <div className="bg-[#1a1a1a] rounded-lg p-3 mb-4 border border-white/10 space-y-1">
                <p className="text-sm text-[#fdfdfd]">
                  <span className="text-[#4b4a4a]">Serviço:</span>{" "}
                  <span className="font-semibold uppercase">{servicoNome}</span>
                </p>
                <p className="text-sm text-[#fdfdfd]">
                  <span className="text-[#4b4a4a]">Profissional:</span>{" "}
                  {selectedFuncionario?.nome}
                </p>
                <p className="text-sm text-[#fdfdfd]">
                  <span className="text-[#4b4a4a]">Data:</span>{" "}
                  {selectedDay && formatDateBR(selectedDay)}
                </p>
                <p className="text-sm text-[#fdfdfd]">
                  <span className="text-[#4b4a4a]">Horário:</span>{" "}
                  {selectedHorario}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-[#4b4a4a] mb-1 block">
                    Nome e Sobrenome
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#4b4a4a] mb-1 block">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={handlePhoneInput}
                    placeholder="(XX)XXXXX-XXXX"
                    className="w-full bg-[#1a1a1a] border border-white/20 rounded-lg px-3 py-2.5 text-[#fdfdfd] text-sm placeholder:text-[#4b4a4a] focus:outline-none focus:border-[#19d18e]"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#19d18e] text-black font-bold uppercase py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
              >
                {submitting ? "Agendando..." : "AGENDAR"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
