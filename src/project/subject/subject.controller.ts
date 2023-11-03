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
  Request,
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
import { SubjectService } from './subject.service';
import { CommonPageDto } from 'src/dto/common-page.dto';


@ApiTags('SUBJECT API')
@Controller('api/subject')
export class SubjectController {
  constructor(
    private subjectService: SubjectService,
  ) {}

  
  /*************************************************
   * 모집공고 임상시험 신청 - 공개포탈
   * 
   * @returns 모집공고 임상시험 신청
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('apply')
  @ApiOperation({
    summary: '모집공고 임상시험 신청',
    description: '모집공고 임상시험 신청',
  })
  async insertSubject( @Request() req , 
                       @TransactionParam() transaction: Transaction ) {
    const member = req.user;
    let props: any = req.body;
    return this.subjectService.insertSubject({props , member , transaction});
  }

  /*************************************************
   * 신청자 상세
   * 
   * @returns  신청자 상세
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/info/:id')
  @ApiOperation({
    summary: ' 신청자 상세',
    description: ' 신청자 상세',
  })
  @ApiParam({name:'id'})
  async getSubjectInfo(@Query() props
                    , @Req() req
                    , @Param('id') path: any
                    , @TransactionParam() transaction: Transaction) {
    const member = req.user;
    props['id'] = path;
    return this.subjectService.getSubjectInfo({props ,member, transaction});
  }

  /*************************************************
   * 신청자 상태 업데이트
   * 
   * @param createProjectDto
   * @returns 신청자 상태 업데이트 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/status/:subjectId')
  @ApiOperation({
    summary: '신청자 상태 정보 수정 API',
    description: '신청자 상태 정보 수정 ',
  })
  // @ApiBody({ type: createProjectDto })
  async updateSubjectStatus(@Body() props, 
                      @Req() req,
                      @Param('subjectId') path: any,
                      @TransactionParam() transaction: Transaction,
  ) {
    const member = req.user;
    props['subjectId'] = path;
    return this.subjectService.updateSubjectStatus({ props , member , transaction });
  }

}
