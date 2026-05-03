import { Controller, Post, Get, Delete, Param, Body, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CadModelsService } from './cad-models.service';
import { extname } from 'path';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { User } from '@/core/decorators/user.decorator';

@Controller('cad-models')
@UseGuards(JwtAuthGuard)
export class CadModelsController {
  constructor(private readonly _cadModelsService: CadModelsService) { }

  @Get()
  async findAll(@User() user: any) {
    return this._cadModelsService.findAll(user?.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @User() user: any) {
    return this._cadModelsService.findOne(id, user?.id);
  }

  @Post(':id/thumbnail')
  async updateThumbnail(@Param('id') id: string, @Body('thumbnail') thumbnail: string) {
    return this._cadModelsService.updateThumbnail(id, thumbnail);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @User() user: any) {
    return this._cadModelsService.delete(id, user?.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCadModel(
    @User() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const ext = extname(file.originalname).toLowerCase();
    if (ext !== '.step' && ext !== '.stp') {
      throw new BadRequestException('Only .step and .stp files are allowed');
    }
    return this._cadModelsService.processUpload(file, user?.id);
  }
}
