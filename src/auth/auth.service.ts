import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthQuery } from 'src/auth/auth.queries';
import { JwtService } from '@nestjs/jwt';
import { Transaction } from 'sequelize';
import Utils from 'src/util/utils';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { SMSSender } from 'src/lib/sms-sender';
@Injectable()
export class AuthService {
  constructor(
    private authQuery: AuthQuery,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name);

  /*************************************************
   * 로그인   
   * 
   * @param LoginDto
   * @returns 로그인성공여부, token
   ************************************************/
  async login(params: any) {
    let { props, transaction } = params;
    let { isAutoLogin } = props
    const member: any = await this.authQuery.memberInfo(params);

    if (member) {
      let dbLocalPw: string = member.LOGIN_PWD;
      let dbPwdErrorCount: number = member.PWD_ERROR_COUNT;
      let dbPwdMonthDiff: number = member.PWD_MONTH_DIFF;
      let dbStatusCode: string = member.STATUS_CD;
      let dbStatusMsg: string;

      switch(dbStatusCode) {
        case 'JOIN': dbStatusMsg = '가입'; break;
        case 'DELETE': dbStatusMsg = '탈퇴'; break;
      }

      if(member.LOGIN_RESTRICTION_YN === 'Y'){
        return {
          statusCode: 20010,
          message: "로그인이 제한되었습니다.",
        };
      }

      if (dbPwdErrorCount >= 5) {
        return {
          statusCode: 20004,
          message: "비밀번호 5회 오류로 인해 로그인이 불가능합니다.\\n비밀번호를 변경해 주세요",
        };
      }

      let hashPassword: string = createHash('sha512')
        .update(props.memberPwd)
        .digest('hex');
        
      if (hashPassword === dbLocalPw) {

          let statusCode = 10000
          let message = "성공"
          // [2-1] 로그인 유저 상태
          if(dbStatusCode !== 'JOIN'){

            return {
              statusCode: 20003,
              message: dbStatusMsg +' 상태입니다. 관리자에 문의하세요',
            };
          }
         
          // [2-3] 비밀번호 3개월 경과 
          if (dbPwdMonthDiff >= 3) {
              statusCode= 20006
          }

          const payload: object = { 
            memberId: member.LOGIN_ID,
            status: member.STATUS_CD,
            memberNm: member.MEMBER_NM,
            useRestrictionYn:member.USE_RESTRICTION_YN,
            loginRestrictionYn:member.LOGIN_RESTRICTION_YN,
            isAutoLogin
          };

          let createAccessToken = await this.createToken(payload);

          return {
            access_token: createAccessToken,
            memberId: member.LOGIN_ID,
            memberNm: member.MEMBER_NM,
            statusCode: statusCode,
            message: message
          };

      } else {
        //비밀번호 틀렸을시,
        return {
          statusCode: 20002,
          message: "비밀번호 " + (dbPwdErrorCount + 1) +" 회 오류입니다.\\n비밀번호 5회 오류시 로그인이 제한됩니다",
          data: {memberId: member.LOGIN_ID}
        };
      }
    } else {
      return {
        statusCode: 20007,
        message: "아이디 혹은 비밀번호가 잘못되었습니다.",
      };
    }
  }

  async createToken(payload: any) {
    let { isAutoLogin } = payload

    let options = {secret: `${process.env.JWT_TOKEN_SECRET}`}
    if (!payload.exp) {
      options['expiresIn'] = isAutoLogin ? `${process.env.JWT_EXPIRE_TIME_AUTO}` : `${process.env.JWT_EXPIRE_TIME}`
    }
    let createAccessToken: string = this.jwtService.sign(payload, options);
    return createAccessToken
  }

}
