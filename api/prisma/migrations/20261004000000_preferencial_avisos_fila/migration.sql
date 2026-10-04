-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "preferencial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ultimoAvisoFila" INTEGER;
