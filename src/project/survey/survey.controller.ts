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
import { SurveyService } from './survey.service';
import { CommonPageDto } from 'src/dto/common-page.dto';

@ApiTags('SURVEY API')
@Controller('api/survey')
export class SurveyController {
  constructor(
    private surveyService: SurveyService,
  ) {}


  /*************************************************
   * 임상완료 설문 결과 생성
   * 
   * @returns 
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/:id')
  @ApiOperation({
    summary: '모집공고 임상시험 신청',
    description: '모집공고 임상시험 신청',
  })
  async insertSubject( @Req() req , 
                       @Param('id') path: any ,
                       @TransactionParam() transaction: Transaction ) {
    const member = req.user;
    let props: any = req.body;
    props['subjectId'] = path;
    return this.surveyService.insertSurveyResult({props , member , transaction});
  }

}
