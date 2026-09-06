-- CreateEnum
CREATE TYPE "Status" AS ENUM ('em_espera', 'em_atendimento', 'ausente', 'finalizado');

-- CreateTable
CREATE TABLE "Paciente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "tipoAtendimento" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "senha" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'em_espera',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendidoEm" TIMESTAMP(3),

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cpf_key" ON "Paciente"("cpf");

-- CreateIndex
CREATE INDEX "Paciente_status_criadoEm_idx" ON "Paciente"("status", "criadoEm");
