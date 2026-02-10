export type TermoInfo = {
  id: string;
  versao: number;
  tipo: string;
  createdAt: string;
  usuarioNome: string;
};

export type TermoDownload = TermoInfo & {
  pdfBase64: string;
  filename: string;
};
