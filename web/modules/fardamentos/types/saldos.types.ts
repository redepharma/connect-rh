import type { Genero } from "./genero.enums";

export type ColaboradorSaldo = {
  id: string;
  variacaoId: string;
  tipoNome: string;
  tamanho: string;
  genero: Genero;
  quantidade: number;
};
