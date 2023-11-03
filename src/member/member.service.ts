import { Injectable, UnauthorizedException,InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { MemberQuery } from './member.queries';
import { AuthQuery } from '../auth/auth.queries';
import { createHash } from 'crypto';
import { Transaction } from 'sequelize';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';
import { SMSSender } from 'src/lib/sms-sender';
import { EmailSender } from 'src/lib/email-sender';
import { EmailSendDto } from 'src/dto/common/email-send.dto';
import Utils from 'src/util/utils';
import { CloudApi } from 'src/lib/cloud-api';

@Injectable()
export class MemberService {
  constructor(
    private memberQuery: MemberQuery,
    private authQuery: AuthQuery,
    private commonQuery: CommonQuery,
    private emailSender: EmailSender , 
    private SMSSender: SMSSender,
    private cloudApi: CloudApi,
  ) {}
  
  /*************************************************
   * 로그인시,  라스트 시간 업데이트
   * 
   * @param LoginDto
   * @returns 
   ************************************************/
  async updateMemberLastLogin(params: any) {   
      //유저 로그인 라스트 시간 업데이트
      await this.memberQuery.updateMemberLastLogin(params);
      // if 로그인 히스토리 추가시, 작업
      
  }


  /*************************************************
   * 멤버 정보 조회
   * 
   * @returns 멤버 정보 조회
   ************************************************/
  async getMemberInfo(params: any) {   
    let { props , member ,transaction } = params

    const memberInfo: any = await this.authQuery.memberInfo(params);
    memberInfo['loginPwd'] = null;
    memberInfo['preLoginPwd'] = null;

    return {
      statusCode: 10000,
      message: '정상적으로 조회되었습니다.',
      data: memberInfo
    };
    
  }

  /*************************************************
   * 공개포탈 멤버 아이디 중복 체크
   * 
   * @returns 공개포탈 멤버 아이디 중복 체크
   ************************************************/
  async getMemberLoginId(params : any) {

    let member: any = await this.memberQuery.getMemberByLoginId({...params});
    
    if (member) {
      return {
        statusCode: 10000,
        message: '사용불가능한 아이디 입니다.',
        data: { isUse : false }
      }
    } else {
      return {
        statusCode: 10000,
        message: '사용가능한 아이디 입니다.',
        data: { isUse : true }
      }
    }
  }

  /*************************************************
   * 인증코드 발송      
   * 
   * @param SignUpDto
   * @returns 인증코드 발송 여부
   ************************************************/
  async insertAuthCode(params: object) {
    let { props , transaction }: any = params;
    let { memberId , mobileNo, authMobileNo, authType, userNm } = props

    let alreadyCheckMobileNoQuery: any = await this.authQuery.memberInfoByMobileNo(params);
    if (alreadyCheckMobileNoQuery) {
      return {
        statusCode: 10000,
        message: '이미 등록된 휴대폰 번호입니다.',
        data : { isChk : false }
      };
    } else {
      let certifyKey = mobileNo
      let certifyCd = Utils.getInstance().getRandomNumber(6)
      let certifyType = authType
      let taskTypeCd = '1012'

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
        console.log(responseData)
    }


    
    return {
      statusCode: 10000,
      message: '인증번호가 발송되었습니다.',
      data : { isChk : true }
    };
  }

  /*************************************************
   * 인증코드 확인      
   * 
   * @param SignUpDto
   * @returns 인증코드 확인 여부
   ************************************************/
  async getAuthCode(params: object) {
    let { props, transaction }: any = params;
    let { memberId , mobileNo, authMobileNo, authType } = props 
   
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
   * 공개포탈 멤버 가입   
   * 
   * @param SignUpDto
   * @returns 공개포탈 멤버 가입 
   ************************************************/
  async insertMember(params:any) {
    let { props } = params;
    let { memberPwd , service, privacy } = props;

    // [1] 멤버 가입
    let hashPassword = createHash('sha512')
      .update(memberPwd )
      .digest('hex');

    props['hashPassword'] = hashPassword;

    const termsAgree = {
      termsKindCd : '', 
      termsTypeCd : 'MEMBER'
    }
    if (service) {
      termsAgree.termsKindCd = 'SERVICE';
      await this.memberQuery.insertTermsAgree({...params,termsAgree})
    }
    if (privacy) {
      termsAgree.termsKindCd = 'PRIVACY';
      await this.memberQuery.insertTermsAgree({...params,termsAgree})
    }

    const insertMember = await this.memberQuery.insertMember(params);
    
    if (insertMember) {
      return {
        statusCode: 10000,
        message: '회원가입이 완료되었습니다.',
        data : { 
          memberId : insertMember , 
          isSuccess : true
         }
      }
    } 
  }

  /*************************************************
   * 공개포탈 ID/PW 본인확인
   * 
   * @param 
   * @returns 공개포탈 ID/PW 본인확인
   ************************************************/
  async getCheckMember(params: any) {
    let { props , member , transaction } = params;
    let { memberId , memberPwd } = props
    // USER ID 조회
    const memberInfo: any = await this.authQuery.memberInfo(params);

    let isCheck = false;
    if(memberInfo){
      let dbLocalPw: string = memberInfo.LOGIN_PWD;
      let hashPassword: string = createHash('sha512').update(memberPwd).digest('hex');
      if (hashPassword === dbLocalPw) {
        isCheck = true
      }
    }

    if(isCheck){
      return {
        statusCode: 10000,
        message: '정상적으로 본인 확인되었습니다.',
        data : isCheck
      };
    }else{
      return {
        statusCode: 10000,
        message: '비밀번호가 일치하지 않습니다.',
        data : isCheck
      };
    }
  }

  /*************************************************
   * 공개포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 공개포탈 - 회원 관리
   ************************************************/
  async updateUser(params : any) {
    let { props , member , transaction} = params
    let { memberId , memberPwd} = props
    
    // [1] 해당 아이디 정보
    const memberInfo : any = await this.authQuery.memberInfo(params);
    
    if(memberPwd){
      const dbPw = memberInfo.LOGIN_PWD;          //기존 비밀번호
      const preDbPw = memberInfo.PRE_LOGIN_PWD;   //이전 비밀번호

      const nowPasswordCheck: string = createHash('sha512')
                            .update(memberPwd)
                            .digest('hex');
      //기존 === 현재 
      if(dbPw === nowPasswordCheck){
        return {
          statusCode: 10000,
          message: '기존 비밀번호와 같습니다.',
          data : {isCheck : false}
        };
      }

      // 이전 === 현재
      else 
      if(preDbPw === nowPasswordCheck){
        return {
          statusCode: 10000,
          message: '이전 비밀번호와 같습니다.',
          data : {isCheck : false}
        };
      }
      // [3] 암호 업데이트
      await this.memberQuery.updateMemberPwd({
        memberId : memberId, 
        dbPw , 
        pwdResetYn : 'Y' ,
        nowPasswordCheck , 
        modifyMemberId : memberId ,
        transaction
      }); 
    }

    // [4] 회원 정보 수정
    await this.memberQuery.updateMemberInfo({...params})


    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
      data : {isCheck : true}
    };
  }

  /*************************************************
   * 공개포탈 - 회원 탈퇴
   * 
   * @param 
   * @returns  공개포탈 - 회원 탈퇴
   ************************************************/
  async deleteMember(params: any){
    let { props , member , transaction} = params

    //[1]임상진행중 프로젝트 여부
    const clinicalYn = await this.memberQuery.clinicalYn({...params})

    if (clinicalYn > 0) {
      return {
        statusCode: 40004,
        message: '현재 참여중인 임상이 있어 \n 회원 탈퇴가 불가능 합니다.',
      }
    }

    //[3] 회원 탈퇴 처리 
    await this.memberQuery.deleteMember({...params})

    return {
      statusCode: 10000,
      message: '정상적으로 탈퇴 처리 되었습니다.',
    }
  }
  /*************************************************
   * 비밀번호 3개월 권고 날짜 변경
   * 
   * @param UserChgPwdDateDto
   * @returns 비밀번호 3개월 권고일 변경
   ************************************************/
  async updateLastPwChgDate(params: any) {
    let { props, transaction}: any = params;
    let { memberId }: any = props;
    
    await this.memberQuery.updateLastPwChgDate({
      memberId
      , pwdResetYn : 'N' 
      , transaction
    }); 
    
    return {
      statusCode: 10000,
      message: '비밀번호 3개월 권고 날짜 변경 완료',
    };
  }
}
