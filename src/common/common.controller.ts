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
import { CommonService } from './common.service';
import { CommonPageDto } from 'src/dto/common-page.dto';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { EmailSendDto } from 'src/dto/common/email-send.dto';
import { CloudApi } from 'src/lib/cloud-api';

@ApiTags('COMMON API')
@Controller('api/common')
export class CommonController {
  constructor(
    private commonService: CommonService,
    private cloudApi: CloudApi,
  ) { }


  /*************************************************
   * 사용자 권한 코드 리스트 조회   
   * 
   * @returns 사용자 권한 리스트
   ************************************************/
  @Get('code-list')
  @ApiOperation({
    summary: '코드 리스트',
    description: '그룹코드로 코드 리스트 조회',
  })
  @ApiQuery({ name: 'groupCd' })
  async getCodeList(@Query() props, @TransactionParam() transaction: Transaction) {
    return this.commonService.getCommonCodeList({props,transaction});
  }
  /*************************************************
    * 그룹CD & 상위공통 코드별 리스트 조회     
    * 
    * @returns 그룹CD & 상위공통 코드별 리스트 
   ************************************************/
  @Get('upper-code-list')
  @ApiOperation({
    summary: '코드 리스트',
    description: '그룹코드와 상위공통 코드로 코드 리스트 조회',
  })
  @ApiQuery({})
  async getUpperCodeList(@Query() props
                        ,@TransactionParam() transaction: Transaction
  ) {
    return this.commonService.getCommonUpperCodeList({props,transaction});
  }
  /*************************************************
   * SMS 발송
   * 
   * @returns 성공실패
   ************************************************/
  @Post('sms')
  @ApiOperation({
    summary: 'SMS 발송',
    description: 'NCP의 문자 서비스 호출',
  })
  @ApiBody({ type: SMSSendDto })
  async sendSMS(@Body() props : SMSSendDto , @TransactionParam() transaction: Transaction) {
    return this.commonService.sendSMS({props,transaction});
  }

  /*************************************************
  * EMAIL 발송
  * 
  * @returns 성공실패
  ************************************************/
  @Post('email')
  @ApiOperation({
    summary: 'EMAIL 발송',
    description: 'NCP의 EMAIL 서비스 호출',
  })
  @ApiBody({ type: EmailSendDto })
  async sendEmail(@Body() props: EmailSendDto, @TransactionParam() transaction: Transaction) {
    return this.commonService.sendEmail({ props, transaction });
  }

  /*************************************************
   * 공개포탈 약관
   * 
   * @param 
   * @returns 공개포탈 약관 정보
   ************************************************/
  @Get('/terms')
  @ApiOperation({
    summary: '공개포탈 약관',
    description: '공개포탈 약관 정보',
  })
  @ApiQuery({})
  async getTerms(@Query() props
                ,@TransactionParam() transaction: Transaction) {
    return this.commonService.getTerms({ props , transaction})
  }
  /*************************************************
  * S3 파일 가져오기
  * 
  * @returns fileStream
  ************************************************/
  @Get('/s3')
  @ApiOperation({
    summary: 'S3 파일 가져오기',
    description: 'S3 파일 가져오기',
  })
  @ApiQuery({ name: 'path' })
  @ApiQuery({ name: 'fileName' })
  async getS3Data(@Query() props, @TransactionParam() transaction: Transaction) {
    return this.cloudApi.getS3Data({ props, transaction });
  }

  /*************************************************
   * S3 파일 가져오기 다운로드 -ALL
   * 
   * @param
   * @returns fileStream
   ************************************************/
  @Post('/s3/download-all/:id')
  @ApiOperation({
      summary: 'S3 파일 가져오기 다운로드 -ALL',
      description: 'S3 파일 가져오기 다운로드 -ALL',
  })
  async postDownloadAllFile(@Param('id') id: any
                          , @Req() req 
                          , @TransactionParam() transaction: Transaction ) {
    let props: any = req.body;
    props['encryptoId'] = id
    
    return this.commonService.downloadFileAll({ props , transaction});
  }




}
