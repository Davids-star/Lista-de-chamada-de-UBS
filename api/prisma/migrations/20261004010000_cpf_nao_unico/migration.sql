-- DropIndex
DROP INDEX "Paciente_cpf_key";

-- CreateIndex
CREATE INDEX "Paciente_cpf_idx" ON "Paciente"("cpf");
