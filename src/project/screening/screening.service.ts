import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { ScreeningQuery } from './screening.queries';
import { ParticipantQuery } from '../participant/participant.queries';
import { CommonQuery } from 'src/common/common.queries';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { SMSSender } from 'src/lib/sms-sender';
import { SubjectQuery } from '../subject/subject.queries';
import { ProjectQuery } from '../project/project.queries';

@Injectable()
export class ScreeningService {
  constructor(
    private screeningQuery: ScreeningQuery,
    private subjectQuery: SubjectQuery,
    private participantQuery: ParticipantQuery,
    private projectQuery: ProjectQuery,
    private commonQuery: CommonQuery,
    private SMSSender: SMSSender,
  ) {}

  // 스크리닝 예약 변경시 TB_SUBJECT 기관 변경 하며, 
  // 해당 피험자 완료된 동의서가 있을 시, 기관 변경 불가
  /*************************************************
   * 스크리닝 예약 정보 수정
   * 
   * @param createProjectDto
   * @returns 스크리닝 예약 정보 수정 성공여부
   ************************************************/
  async updateScreening(params : any) {
    let { props , member , transaction } = params;
    let { projectId, subjectId, screeningDate , screeningTime , statusCd , organizationCd } = props

    // [1] 스크리닝 변경 - statusCd = APPLY
    await this.screeningQuery.updateScreening({...params});

    // [2] 프로젝트 ID 로 조회 
    props['id']=projectId
    let project: any = await this.projectQuery.getProjectById({...params});
    props['protocolNo']=project?.PROTOCOL_NO
    props['project']=project

    // [4] 서브젝트 ID 조회
    let subject: any = await this.subjectQuery.getSubjectInfo({...params});
    props['applicantMobileNo']=subject?.APPLICANT_MOBILE_NO
    
    props['taskTypeCd']='1003'
    let responseData : any = await this.sendSmsScreening({...params})
    
    // [5] 스크리닝 HISTORY
    await this.insertScreeningHistory({...params});

    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
    };

  }

  /*************************************************
   * 스크리닝 예약 문자 SMS SEND
   * 
   * @param 
   * @returns 스크리닝 예약 문자 SMS SEND
   ************************************************/
  async sendSmsScreening(params : any) {
    let { props , member , transaction } = params;
    let { project
      , taskTypeCd
      , applicantNm , applicantMobileNo 
      , screeningDate , screeningTime
      , cancelDateTime
    } = props
    let { POST_TITLE } = project

    // [1] 메세지 템플릿 조회
    let MSGTemplatesDto : MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd  })
    let body = MSGTemplatesDto.contents.replace(/#{applicantNm}/g, applicantNm)
                                       .replace(/#{postTitle}/g, POST_TITLE)
                                       .replace(/#{screeningDate}/g, screeningDate || '')
                                       .replace(/#{screeningTime}/g, screeningTime || '')
                                       .replace(/#{cancelDateTime}/g, cancelDateTime || '')

    let smsSendDto:SMSSendDto = {
      SMSType: MSGTemplatesDto.msgTypeCd,
      smsSenderNo: MSGTemplatesDto.sender,
      receiveNo: applicantMobileNo,
      subject: MSGTemplatesDto.title,
      content: body
    } 

    let responseData = await this.SMSSender.sendSMS(smsSendDto)

    return responseData
  }

  /*************************************************
   * 스크리닝 예약 이력 생성
   * 
   * @returns  
   ************************************************/
  async insertScreeningHistory(params : any) {
    let { props , member , transaction } = params;
    let { subjectId, screeningDate , screeningTime , statusCd , organizationCd
    } = props
    
    // 상태(신청 : APPLY ,예약완료 : RESERVATION, 변경 : CHANGE, 취소 : CANCEL) GROUP_CD : SCREEN_HIST_STATUS
    
    props['requestTypeCd'] = 'APPLICANT'
    await this.screeningQuery.insertScreeningHistory({...params});
  }

  /*************************************************
   * 스크리닝 예약 이력
   * 
   * @returns  스크리닝 예약 이력 리스트
   ************************************************/
  async getScreeningHistory(params : any) {
    let { props , member , transaction } = params;
    let { id , subjectId } = props
    
    let screeningHistoryList: any = await this.screeningQuery.getScreeningHistory({...params});
    
    return {
      statusCode: 10000,
      message: '정상적으로 조회되었습니다.',
      data: screeningHistoryList,
    };
  }


}
