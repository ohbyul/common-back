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
import { ConsentService } from './consent.service';
import { CommonPageDto } from 'src/dto/common-page.dto';

import { AnyFilesInterceptor } from '@nestjs/platform-express';
import multerS3 from 'multer-s3';
import moment from 'moment';
import path from 'path';
import AWS from 'aws-sdk';

@ApiTags('CONSENT API')
@Controller('api/consent')
export class ConsentController {
  constructor(
    private consentService: ConsentService,
  ) {}

  /*************************************************
   * 서명동의서 다운로드시, 이력 생성
   * 
   * @returns  서명동의서 다운로드시, 이력 생성
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/download/history')
  @ApiOperation({
    summary: '신청자 개인정보보기 내역',
    description: '신청자 개인정보보기 내역',
  })
  async insertConsentDownloadHistory( @Req() req , 
                                      @Body() props , 
                                      @TransactionParam() transaction: Transaction ) {
    const member = req.user;
    return this.consentService.insertConsentDownloadHistory({props , member , transaction});
  }

}
