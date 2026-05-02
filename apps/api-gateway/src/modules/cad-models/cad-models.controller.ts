import { Controller, Post, Get, Param, Body, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CadModelsService } from './cad-models.service';
import { extname } from 'path';


@Controller('cad-models')
export class CadModelsController {
  constructor(private readonly _cadModelsService: CadModelsService) { }

  @Get()
  async findAll() {
    return this._cadModelsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this._cadModelsService.findOne(id);
  }

  @Post(':id/thumbnail')
  async updateThumbnail(@Param('id') id: string, @Body('thumbnail') thumbnail: string) {
    return this._cadModelsService.updateThumbnail(id, thumbnail);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCadModel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const ext = extname(file.originalname).toLowerCase();
    if (ext !== '.step' && ext !== '.stp') {
      throw new BadRequestException('Only .step and .stp files are allowed');
    }
    return this._cadModelsService.processUpload(file);
  }
}
