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
import { CounselService } from './counsel.service';
import { CommonPageDto } from 'src/dto/common-page.dto';

@ApiTags('COUNSEL API')
@Controller('api/counsel')
export class CounselController {
  constructor(
    private counselService: CounselService,
  ) {}

  /*************************************************
   * 비대면상담 예약 정보 등록
   * 
   * @param createProjectDto
   * @returns 비대면상담 예약 정보 등록 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/reservation/:projectId')
  @ApiOperation({
    summary: '비대면상담 예약 정보 등록 API',
    description: '비대면상담 예약 정보 등록 ',
  })
  // @ApiBody({ type: createProjectDto })
  async insertCounsel(@Body() props, 
                      @Req() req,
                      @Param('projectId') path: any,
                      @TransactionParam() transaction: Transaction,
  ) {
    const member = req.user;
    props['projectId'] = path;
    return this.counselService.insertCounsel({ props , member , transaction });
  }
  
  /*************************************************
   * 비대면상담 예약 정보 수정 
   * 
   * @param createProjectDto
   * @returns 비대면상담 예약 정보 수정 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/reservation/:subjectId')
  @ApiOperation({
    summary: '비대면상담 예약 정보 수정 API',
    description: '비대면상담 예약 정보 수정 ',
  })
  // @ApiBody({ type: createProjectDto })
  async updateCounsel(@Body() props, 
                      @Req() req,
                      @Param('subjectId') path: any,
                      @TransactionParam() transaction: Transaction,
  ) {
    const member = req.user;
    props['subjectId'] = path;
    return this.counselService.updateCounsel({ props , member , transaction });
  }

  /*************************************************
   * 비대면상담 이력 조회
   * 
   * @returns  비대면상담 이력
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/history/:id')
  @ApiOperation({
    summary: ' 비대면상담 상세',
    description: ' 비대면상담 상세',
  })
  @ApiParam({name:'id'})
  async getSubjectCounselHistory(@Query() props
                              , @Req() req
                              , @Param('id') path: any
                              , @TransactionParam() transaction: Transaction) {
    const member = req.user;
    props['id'] = path;
    return this.counselService.getSubjectCounselHistory({props ,member, transaction});
  }

}
