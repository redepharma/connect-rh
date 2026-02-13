import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermoEntity } from '../entities/termo.entity';
import { MovimentacaoEntity } from '../entities/movimentacao.entity';
import type { RequestUser } from '../../auth/types/auth.types';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

type PdfVfs = Record<string, string>;
type PdfDocGenerator = {
  getBuffer: (cb: (buffer: Uint8Array) => void) => void;
};
type PdfMakeLike = {
  vfs?: PdfVfs;
  createPdf: (docDefinition: unknown) => PdfDocGenerator;
};
type PdfFontsLike = {
  pdfMake?: { vfs?: PdfVfs };
  vfs?: PdfVfs;
};

const pdfMakeInstance = pdfMake as unknown as PdfMakeLike;
const pdfFontsInstance = pdfFonts as unknown as PdfFontsLike;
const vfs = pdfFontsInstance?.pdfMake?.vfs ?? pdfFontsInstance?.vfs;
if (vfs) {
  pdfMakeInstance.vfs = vfs;
}

@Injectable()
export class TermosService {
  constructor(
    @InjectRepository(TermoEntity, 'primary')
    private readonly termosRepo: Repository<TermoEntity>,
    @InjectRepository(MovimentacaoEntity, 'primary')
    private readonly movRepo: Repository<MovimentacaoEntity>,
  ) {}

  async gerarTermo(movimentacaoId: string, user: RequestUser) {
    const movimentacao = await this.movRepo.findOne({
      where: { id: movimentacaoId },
      relations: ['unidade', 'itens', 'itens.variacao', 'itens.variacao.tipo'],
    });

    if (!movimentacao) {
      throw new NotFoundException('Movimentação não encontrada.');
    }

    const ultimo = await this.termosRepo.findOne({
      where: { movimentacao: { id: movimentacaoId } },
      order: { versao: 'DESC' },
    });
    const versao = (ultimo?.versao ?? 0) + 1;

    const docDefinition = {
      content: [
        { text: 'Termo de Movimentação', style: 'header' },
        {
          text: `Tipo: ${movimentacao.tipo} | Status: ${movimentacao.status}`,
          margin: [0, 8, 0, 8],
        },
        {
          text: `Colaborador: ${movimentacao.colaboradorNome} (${movimentacao.colaboradorId})`,
        },
        { text: `Unidade: ${movimentacao.unidade?.nome ?? '-'}` },
        { text: `Versão: ${versao}` },
        { text: `Data: ${new Date().toLocaleString('pt-BR')}` },
        { text: 'Itens', style: 'subheader', margin: [0, 12, 0, 4] },
        {
          ul: movimentacao.itens.map((item) => {
            const variacao = item.variacao;
            const tipoNome = variacao?.tipo?.nome ?? '-';
            const tamanho = variacao?.tamanho ?? '-';
            const genero = variacao?.genero ?? '-';
            return `${tipoNome} - ${tamanho} - ${genero} | Qtd: ${item.quantidade}`;
          }),
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 12, bold: true },
      },
      defaultStyle: { fontSize: 10 },
    };

    const pdfBase64 = await this.gerarPdfBase64(docDefinition);

    const termo = this.termosRepo.create({
      movimentacao,
      versao,
      tipo: movimentacao.tipo,
      pdfBase64,
      usuarioId: String(user.id ?? ''),
      usuarioNome: user.nome ?? user.usuario ?? 'Usuário',
    });

    const saved = await this.termosRepo.save(termo);

    return {
      id: saved.id,
      versao: saved.versao,
      createdAt: saved.createdAt,
    };
  }

  async listarPorMovimentacao(movimentacaoId: string) {
    const termos = await this.termosRepo.find({
      where: { movimentacao: { id: movimentacaoId } },
      order: { versao: 'DESC' },
    });

    return termos.map((termo) => ({
      id: termo.id,
      versao: termo.versao,
      tipo: termo.tipo,
      createdAt: termo.createdAt,
      usuarioNome: termo.usuarioNome,
    }));
  }

  async buscarTermo(id: string) {
    const termo = await this.termosRepo.findOne({ where: { id } });
    if (!termo) {
      throw new NotFoundException('Termo não encontrado.');
    }

    return {
      id: termo.id,
      versao: termo.versao,
      tipo: termo.tipo,
      createdAt: termo.createdAt,
      usuarioNome: termo.usuarioNome,
      pdfBase64: termo.pdfBase64,
      filename: `termo_${termo.tipo.toLowerCase()}_v${termo.versao}.pdf`,
    };
  }

  private gerarPdfBase64(docDefinition: unknown): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMakeInstance.createPdf(docDefinition);
        pdfDocGenerator.getBuffer((buffer: Uint8Array) => {
          const base64 = Buffer.from(buffer).toString('base64');
          resolve(base64);
        });
      } catch (err) {
        reject(
          err instanceof Error ? err : new Error('Falha ao gerar PDF do termo'),
        );
      }
    });
  }
}
