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
import { MemberQuery } from 'src/member/member.queries';
import { MemberService } from 'src/member/member.service';
@Injectable()
export class AuthService {
  constructor(
    private authQuery: AuthQuery,
    private memberQuery: MemberQuery,
    private commonQuery: CommonQuery,
    private jwtService: JwtService,
    private memberService: MemberService,
    private SMSSender: SMSSender,
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
         
          //last_login_utc_dtm 업데이트
          await this.memberService.updateMemberLastLogin(params);

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
        await this.memberQuery.pwdErrorUpdate(params)
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

  /*************************************************
   * 자동 로그인   
   * 
   * @param LoginDto
   * @returns 로그인성공여부, token
   ************************************************/
  async autoLogin(params: any) {
    let { props, transaction } = params;
    let { isAutoLogin } = props

    const member: any = await this.authQuery.memberInfo(params);
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
      statusCode: 10000,
      message: '성공'
    };
  }


  async createToken(payload: any) {
    let { isAutoLogin } = payload

    let options = {
      secret: `${process.env.JWT_TOKEN_SECRET}`,
    }

    if (!payload.exp) {
      options['expiresIn'] = isAutoLogin ? `${process.env.JWT_EXPIRE_TIME_AUTO}` : `${process.env.JWT_EXPIRE_TIME}`
    }

    let createAccessToken: string = this.jwtService.sign(payload, options);

    return createAccessToken
  }

  /*************************************************
  * 인증코드 발송      
  * 
  * @param AuthCodeDto
  * @returns 인증코드 발송 여부
  ************************************************/
  async createAuthCode(params: object) {
    let { props , transaction }: any = params;
    let { mobileNo, authType , isFindPw , memberId} = props
    let certifyKey = mobileNo
    let certifyCd = Utils.getInstance().getRandomNumber(6)
    let certifyType = authType
    let taskTypeCd = '1012'

      // *비밀번호찾기 아이디,휴대폰 체크*
      if(isFindPw){
        const member: any = await this.authQuery.memberInfo(params);
        if(member?.MOBILE_NO !== mobileNo){
          return {
            statusCode: 10000,
            message: '해당 아이디에 등록된 휴대폰번호가 아닙니다.',
            data : { isChk :false }
          };
        } 
      }
      //인증번호 저장
      await this.authQuery.insertCertifyCd({ transaction , props : { certifyKey, certifyCd, certifyType }})

      let MSGTemplatesDto:MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd  })

      let smsSendDto:SMSSendDto = {
        SMSType: MSGTemplatesDto.msgTypeCd,
        smsSenderNo: MSGTemplatesDto.sender,
        receiveNo: mobileNo,
        subject: MSGTemplatesDto.title,
        content: MSGTemplatesDto.contents.replace(/#{certifycd}/g, certifyCd)
      } 

      let responseData = await this.SMSSender.sendSMS(smsSendDto)

      return {
        statusCode: 10000,
        message: '인증번호가 발송되었습니다.',
        data : { isChk : true }
      };
  }

  /*************************************************
  * 인증코드 확인      
  * 
  * @param AuthCodeDto
  * @returns 인증코드 확인 여부
  ************************************************/
  async getAuthCode(params: object) {
    let { props, transaction }: any = params;
    let { mobileNo, authMobileNo } = props 
  
    let certifyKey = mobileNo
    let certifyCd = authMobileNo

    //인증번호 확인
    let certifyInfo = await this.authQuery.getCertifyCd({ transaction , props : { certifyKey, certifyCd }})
    if(certifyInfo){
      return {
        statusCode: 10000,
        message: '인증이 완료되었습니다.',
        data : { isChk : true }
      };
    }else{
      return {
        statusCode: 10000,
        message: '인증번호를 정확히 입력해 주세요.',
        data : { isChk : false }
      };

    }
  }

  /*************************************************
  * 사용자 ID 조회 by 사용자 휴대폰 번호
  * 
  * @param {String} mobileNo 사용자 휴대폰 번호
  * @returns 사용자 휴대폰 번호와 일치하는 ID 반환 
  ************************************************/
  async getFindId(params: any) {

    let findMemberInfo = await this.authQuery.memberInfoByMobileNo(params)
    if (findMemberInfo) {
      return {
        statusCode: 10000,
        data : { memberId : findMemberInfo.LOGIN_ID,
                 memberJoinDate : findMemberInfo.JOIN_DTM}
      };
    } else {
      return {
        statusCode: 30006,
        message: `회원정보를 찾을 수 없습니다. \n고객센터를 통해 문의주시기 바랍니다.`,
      };
    }
  }

  /*************************************************
  * 사용자 ID 조회 by 사용자 ID
  * 
  * @param {String} memberId 사용자 아이디
  * @returns 사용자 ID와 일치하는 ID 여부 반환
  ************************************************/
  async getFindSearchId(params: any) {
    let findSearchMemberId: any = await this.authQuery.memberInfo(params)
    if (findSearchMemberId) {
      return {
        statusCode: 10000,
        data : { memberId : findSearchMemberId.LOGIN_ID,
                memberJoinDate : findSearchMemberId.JOIN_DTM }
      };
    } else {
      return {
        statusCode: 30007,
        message: `확인되지 않는 아이디입니다.\n 아이디를 다시 확인해 주세요.`,
      };
    }
  }

  /*************************************************
  * 비밀번호 재설정
  * 
  * @param PwdChangeDto
  * @returns 비밀번호 재설정 성공여부
  ************************************************/
  async updatePw(params: object) {
    let { props, transaction }: any = params;
    let { memberId, memberPwd}: any = props;
    const modifyMemberId = memberId

    const memberInfo: any = await this.authQuery.memberInfo(params);
    let dbPw: string = memberInfo.LOGIN_PWD;
    let dbLoginPwdPre: string = memberInfo.PRE_LOGIN_PWD;

    let nowPasswordCheck: string = createHash('sha512')
        .update(memberPwd)
        .digest('hex');

    // [1-1] 신규 비밀번호가 현재비밀번호와 같을 시
    if (nowPasswordCheck === dbPw) {
      return {
        statusCode: 20008,
        message: '새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.'
      } 
    } else if (nowPasswordCheck === dbLoginPwdPre) {
      // [1-2]신규비밀번호가 이전비밀번호와 같을시
      return{
        statusCode: 30005,
        message: '새 비밀번호는 이전에 사용하셨던 비밀번호와 다르게 입력해 주세요.'
      }
    }
    
    // [2] 암호 업데이트 
    await this.memberQuery.updateMemberPwd({
      memberId
      , dbPw
      , pwdResetYn : 'N'
      , nowPasswordCheck
      , modifyMemberId
      , transaction
    });

    return {
      statusCode: 10000,
      message: '비밀번호가 변경되었습니다. \n 재 로그인 해주시기 바랍니다.',
    };
  }
}
