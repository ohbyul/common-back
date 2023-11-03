import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Options,
  Req,
  UseGuards,
  UploadedFiles,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TransactionParam } from 'src/decorator/transaction.deco';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { Transaction } from 'sequelize';
import { ExaminationService } from './examination.service';
import { createProjectDto } from 'src/dto/project/create-project.dto';
import { CommonPageDto } from 'src/dto/common-page.dto';

@ApiTags('EXAMININATION API')
@Controller('api/examination')
export class ExaminationController {
  constructor(
    private examinationService: ExaminationService,
  ) {}

}
