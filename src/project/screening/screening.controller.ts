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
import { ScreeningService } from './screening.service';
import { CommonPageDto } from 'src/dto/common-page.dto';

@ApiTags('SCREENING API')
@Controller('api/screening')
export class ScreeningController {
  constructor(
    private screeningService: ScreeningService,
  ) {}

  /*************************************************
   * 스크리닝 예약 정보 수정
   * 
   * @param createProjectDto
   * @returns 스크리닝 예약 정보 수정 성공여부
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/reservation/:subjectId')
  @ApiOperation({
    summary: '스크리닝 예약 정보 수정 API',
    description: '스크리닝 예약 정보 수정 ',
  })
  // @ApiBody({ type: createProjectDto })
  async updateScreening(@Body() props, 
                      @Req() req,
                      @Param('subjectId') path: any,
                      @TransactionParam() transaction: Transaction,
  ) {
    const member = req.user;
    props['subjectId'] = path;
    return this.screeningService.updateScreening({ props , member , transaction });
  }

  /*************************************************
   * 스크리닝 예약 이력
   * 
   * @returns  스크리닝 예약 이력 리스트
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/history/:id')
  @ApiOperation({
    summary: '스크리닝 예약 이력',
    description: '스크리닝 예약 이력',
  })
  @ApiParam({name:'id'})
  async getScreeningHistory(@Query() props
                    , @Req() req
                    , @Param('id') path: any
                    , @TransactionParam() transaction: Transaction) {
    const member = req.user;
    props['id'] = path;
    return this.screeningService.getScreeningHistory({props ,member, transaction});
  }

}
