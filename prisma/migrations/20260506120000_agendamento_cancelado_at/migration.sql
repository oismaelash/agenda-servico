-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN "cancelado_at" DATETIME;

-- Cancelamentos antigos sem data: considerar já fora do período de exibição
UPDATE "agendamentos" SET "cancelado_at" = '1970-01-01 00:00:00.000' WHERE "status" = 'cancelado' AND "cancelado_at" IS NULL;
