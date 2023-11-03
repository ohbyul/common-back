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
import { ParticipantService } from './participant.service';
import { createProjectDto } from 'src/dto/project/create-project.dto';
import { CommonPageDto } from 'src/dto/common-page.dto';

import { AnyFilesInterceptor } from '@nestjs/platform-express';
import multerS3 from 'multer-s3';
import moment from 'moment';
import path from 'path';
import AWS from 'aws-sdk';

@ApiTags('PARTICIPANT API')
@Controller('api/participant')
export class ParticipantController {
  constructor(
    private participantService: ParticipantService,
  ) {}


}
