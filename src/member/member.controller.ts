import { 
    Controller, 
    Get, Post, Put,
    Request, Req, Body,
    Query, UseGuards, Param ,UploadedFiles, StreamableFile, Delete} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemberService } from './member.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransactionParam } from 'src/decorator/transaction.deco';
import { Transaction } from 'sequelize';
import { AuthCodeDto } from 'src/dto/auth/auth-code.dto';
import { UserChgPwdDateDto } from 'src/dto/user/userChgPwdDate.dto';

@ApiTags('MEMBER API')
@Controller('api/member')
export class MemberController {
    constructor(
        private memberService: MemberService,
    ) {}

  /*************************************************
   * 멤버 정보 조회
   * 
   * @returns 멤버 정보 조회
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('info/:memberId')
  @ApiOperation({
    summary: '멤버 정보 조회',
    description: '멤버 정보 조회',
  })
  @ApiParam({name:'memberId'})
  async getMemberInfo(@Query() props
                    , @Req() req
                    , @Param('memberId') path: any
                    , @TransactionParam() transaction: Transaction) {
    const member = req.user;
    props['memberId'] = path;
    return this.memberService.getMemberInfo({props ,member, transaction});
  }

  /*************************************************
   * 공개포탈 멤버 아이디 중복 체크 
   * 
   * @returns 공개포탈 멤버 아이디 중복 체크
   ************************************************/
  @Get('id/:loginId')
  @ApiOperation({
    summary: '공개포탈 멤버 아이디 중복 체크',
    description: '공개포탈 멤버 아이디 중복 체크',
  })
  @ApiParam({name:'loginId'})
  async getMemberLoginId(@Query() props
                       , @Param('loginId') path: any
                       , @TransactionParam() transaction: Transaction) {
    props['loginId'] = path;
    return this.memberService.getMemberLoginId({props , transaction});
  }

  /*************************************************
   * 인증코드 발송 
   * 
   * @param AuthCodeDto
   * @returns 인증코드 발송 여부
   ************************************************/
  @Post('auth-code')
  @ApiOperation({
    summary: '인증코드 발송 API',
    description: '관리 포탈 사용자 인증코드 발송',
  })
  @ApiBody({ type: AuthCodeDto })
  async insertAuthCode(@TransactionParam() transaction: Transaction,
                       @Body() props, 
  ) {
    return this.memberService.insertAuthCode({ props , transaction });
  }
  
  /*************************************************
   * 인증코드 확인 
   * 
   * @param AuthCodeDto
   * @returns 인증코드 발송 여부
   ************************************************/
  @Get('auth-code')
  @ApiOperation({
    summary: '인증코드 확인 API',
    description: '관리 포탈 사용자 인증코드 확인',
  })
  @ApiQuery({ type: AuthCodeDto })
  async getAuthCode( @Query() props
                    ,@TransactionParam() transaction: Transaction
  ) {
    return this.memberService.getAuthCode({ transaction, props });
  }
  /*************************************************
   * 공개포탈 멤버 가입 
   * 
   * @param SignUpDto
   * @returns 공개포탈 멤버 가입 
   ************************************************/
  @Post('join')
  @ApiOperation({
    summary: '공개포탈 멤버 가입  API',
    description: '공개포탈 멤버 가입 ',
  })
  async insertMember( @Body() props, 
                      @TransactionParam() transaction: Transaction,
  ) {
    return this.memberService.insertMember({ transaction, props });
  }

  /*************************************************
   * 공개포탈 ID/PW 본인확인
   * 
   * @param 
   * @returns 공개포탈 ID/PW 본인확인
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/check')
  @ApiOperation({
    summary: '공개포탈 ID/PW 본인확인',
    description: '공개포탈 ID/PW 본인확인',
  })
  async getCheckMember( @Query() props
                    , @Request() req 
                    , @TransactionParam() transaction: Transaction ) {
    const member = req.user;
    return this.memberService.getCheckMember({props , member , transaction});
  }

  /*************************************************
   * 공개포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 공개포탈 - 회원 관리
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/')
  @ApiOperation({
    summary: '공개포탈 - 회원 관리',
    description: '공개포탈 - 회원 관리',
  })
  // @ApiBody({ type: UserChgPwdDateDto })
  async updateUser( @Body() props
                  , @Request() req 
                  , @TransactionParam() transaction: Transaction
  ) {
    const member = req.user;
    return this.memberService.updateUser({ props , member, transaction });
  }

  /*************************************************
   * 공개포탈 - 회원 탈퇴
   * 
   * @param 
   * @returns  공개포탈 - 회원 탈퇴 
   * DELETE로 했을 시 Body를 못 받음으로 put 으로 처리
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Put('/secession')
  @ApiOperation({
    summary: '공개포탈 - 회원 탈퇴',
    description: '공개포탈 - 회원 탈퇴',
  })
  async deleteMember( @Body() props, 
                    @Req() req,
                    @TransactionParam() transaction: Transaction,
  ) {
    const member = req.user;
    return this.memberService.deleteMember({ props , member , transaction });
  }



  /*************************************************
   * 비밀번호 3개월 권고 날짜 변경
   * 
   * @param UserChgPwdDateDto
   * @returns 비밀번호 3개월 권고일 변경
   ************************************************/
  @Put('last-pw-chg-date')
  @ApiOperation({
    summary: '비밀번호 권고일 변경 API',
    description: '관리 포탈 비밀번호 3개월 권고일 변경',
  })
  @ApiBody({ type: UserChgPwdDateDto })
  async updateLastPwChgDate(  @Body() props : UserChgPwdDateDto
                    ,@TransactionParam() transaction: Transaction
  ) {
    return this.memberService.updateLastPwChgDate({ props , transaction });
  }

}
