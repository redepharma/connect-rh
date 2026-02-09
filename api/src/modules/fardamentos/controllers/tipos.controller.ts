import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TiposService } from '../services/tipos.service';
import { CreateTipoDto } from '../dto/create-tipo.dto';
import { UpdateTipoDto } from '../dto/update-tipo.dto';

@Controller('fardamentos/tipos')
export class TiposController {
  constructor(private readonly tiposService: TiposService) {}

  @Post()
  create(@Body() dto: CreateTipoDto) {
    return this.tiposService.create(dto);
  }

  @Get()
  findAll() {
    return this.tiposService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTipoDto) {
    return this.tiposService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tiposService.remove(id);
    return { ok: true };
  }
}
