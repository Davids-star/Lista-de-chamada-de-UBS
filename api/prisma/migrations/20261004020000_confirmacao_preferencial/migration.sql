-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'aguardando_confirmacao';
ALTER TYPE "Status" ADD VALUE 'recusado';

-- AlterTable
ALTER TABLE "Paciente" ALTER COLUMN "senha" DROP NOT NULL;
