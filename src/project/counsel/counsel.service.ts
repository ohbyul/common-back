import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { CounselQuery } from './counsel.queries';
import { ProjectQuery } from '../project/project.queries';
import { ParticipantQuery } from '../participant/participant.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';
import { SMSSendDto } from 'src/dto/common/sms-send.dto';
import { SubjectQuery } from '../subject/subject.queries';
import { CommonQuery } from 'src/common/common.queries';
@Injectable()
export class CounselService {
  constructor(
    private counselQuery: CounselQuery,
    private projectQuery: ProjectQuery,
    private participantQuery: ParticipantQuery,
    private subjectQuery: SubjectQuery,
    private commonQuery: CommonQuery,
    private SMSSender: SMSSender,
  ) {}

  /*************************************************
   * 비대면상담 예약 정보 등록
   * 
   * @param createProjectDto
   * @returns 비대면상담 예약 정보 등록 성공여부
   ************************************************/
  async insertCounsel(params : any) {
    let { props , member , transaction } = params;
    let { projectId , subjectId , organizationCd
      , counselId
      , applyCounselDate , applyCounselTime , applyReasonCd , participantId , statusCd  
      , isCreate 
    } = props

    // [1] 프로젝트 ID 로 조회 PROTOCOL_NO
    props['id']=projectId
    let project: any = await this.projectQuery.getProjectById({...params});
    props['protocolNo']=project.PROTOCOL_NO

    // [ TASK_TYPE_CD ] 1006 확정 / 1007 변경 / 1008 취소

    if(isCreate){
      // [2] 새등록
      // 신청자의 신청시에는 문자 X 연구자가 확정시에만 문자
      props['requestTypeCd']='APPLICANT'
      let counselId: any = await this.counselQuery.insertCounsel({...params});
    }

    else{
      // [2] 수정
      await this.counselQuery.updateCounsel({...params});

      // 상담 리스트 (전체)
      let counselList : any = await this.counselQuery.getSubjectCounsel({...params});
      props['counselOrigin']=counselList[0]

      if(statusCd === 'RESERVATION'){
        props['taskTypeCd']='1007'
      }

      else 
      if(statusCd === 'CANCEL'){
        props['taskTypeCd']='1008'
      }

      // [3] 시험자 SMS
      props['project']=project
      let responseData : any = await this.sendSmsCounsel({...params})

      // [4] 연구참여자 SMS
      let responseDataParticapant : any = await this.sendSmsCounselParticapant({...params})
    }

    return {
      statusCode: 10000,
      message: statusCd === 'CANCEL' ? '비대면상담 예약이 취소되었습니다.' : '정상적으로 등록되었습니다.',
      isInsert :  true
    };

  }


  /*************************************************
   * 비대면상담 예약 정보 수정
   * 
   * @param createProjectDto
   * @returns 비대면상담 예약 정보 수정 성공여부
   ************************************************/
  async updateCounsel(params : any) {
    let { props , member , transaction } = params;
    let { subjectId } = props

    // [1] 비대면상담 변경
    await this.counselQuery.updateCounsel({...params});

    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
    };

  }

  /*************************************************
   * 신청자 비대면상담 이력 조회
   * 
   * @returns  신청자 비대면상담
   ************************************************/
  async getSubjectCounselHistory(params : any) {
    let { props , member , transaction } = params
    let { id, subjectId } = props;

    //[2] 비대면 이력 리스트
    let counselList: any = await this.counselQuery.getSubjectCounselHistory({...params});
    
    return {
      statusCode: 10000,
      message: '정상적으로 조회되었습니다.',
      data: counselList,
    };
  }


  /*************************************************
   * 비대면상담 예약 문자 SMS SEND
   * 
   * @param 
   * @returns 비대면상담 예약 문자 SMS SEND
   ************************************************/
  async sendSmsCounsel(params : any) {
    let { props , member , transaction } = params;
    let { projectId , subjectId , organizationCd
        , counselId
        , applyCounselDate , applyCounselTime , applyReasonCd , participantId , statusCd  
        , project , counselOrigin
        , taskTypeCd
      } = props
    let { POST_TITLE } = project
    let counselUrl = '-'

    // 비대면 기관조회
    props['protocolNoOrigin'] = project?.PROTOCOL_NO
    const projectOrganizationList: any = await this.participantQuery.getProjectOrganizationList({...params});
    let organization = projectOrganizationList?.find(org=>org.ORGANIZATION_CD === organizationCd)

    // 비대면 담당연구원 조회
    const projectParticipantList: any = await this.participantQuery.getProjectParticipantList({...params , org : {organizationCd}});
    let participant = projectParticipantList?.find(z=>z.PROJECT_PARTICIPANT_ID === participantId)

    // 피험자조회
    let subject : any = await this.subjectQuery.getSubjectInfo({...params});

    // [1] 메세지 템플릿 조회
    let MSGTemplatesDto : MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd  });
    let body = MSGTemplatesDto.contents.replace(/#{applicantNm}/g, subject?.APPLICANT_NM)
                                      .replace(/#{postTitle}/g, POST_TITLE)
                                      .replace(/#{applyCounselDate}/g, applyCounselDate || '')
                                      .replace(/#{applyCounselTime}/g, applyCounselTime || '')
                                      .replace(/#{organizationNm}/g, organization?.ORGANIZATION_NM || '')
                                      .replace(/#{contactNo}/g, organization?.CONTACT_NO || '')
                                      .replace(/#{APPLY_COUNSEL_DATE}/g, counselOrigin?.APPLY_COUNSEL_DATE || '')
                                      .replace(/#{APPLY_COUNSEL_TIME}/g, counselOrigin?.APPLY_COUNSEL_TIME || '')
                                      .replace(/#{subjectNm}/g, subject?.SUBJECT_NM || '')
                                      .replace(/#{participantNm}/g, participant?.PARTICIPANT_NM || '')
                                      .replace(/#{counselUrl}/g, counselUrl || '')


    let responseData :any ;
    if(subject?.APPLICANT_MOBILE_NO){
      let smsSendDto:SMSSendDto = {
        SMSType: MSGTemplatesDto.msgTypeCd,
        smsSenderNo: MSGTemplatesDto.sender,
        receiveNo: subject?.APPLICANT_MOBILE_NO,
        subject: MSGTemplatesDto.title,
        content: body
      } 
  
      responseData = await this.SMSSender.sendSMS(smsSendDto)
    }
    
    return responseData
  }
  /*************************************************
   * 비대면상담 예약 확정/변경/취소 문자 (연구참여자)
   * 
   * @param 
   * @returns 비대면상담 예약 문자 SMS SEND
   ************************************************/
  async sendSmsCounselParticapant(params : any) {
    let { props , member , transaction } = params;
    let { projectId , subjectId , organizationCd
        , counselId
        , applyCounselDate , applyCounselTime , applyReasonCd , participantId , statusCd  
        , project , counselOrigin
        , taskTypeCd
      } = props
    let { POST_TITLE } = project
    let counselUrl = '-'

    // 비대면 기관조회
    props['protocolNoOrigin'] = project?.PROTOCOL_NO
    const projectOrganizationList: any = await this.participantQuery.getProjectOrganizationList({...params});
    let organization = projectOrganizationList?.find(org=>org.ORGANIZATION_CD === organizationCd)

    // 비대면 담당연구원 조회
    const projectParticipantList: any = await this.participantQuery.getProjectParticipantList({...params , org : {organizationCd}});
    let participant = projectParticipantList?.find(z=>z.PROJECT_PARTICIPANT_ID === participantId)

    // * 연구자 전번 존재 여부 * //
    if(participant?.MOBILE_NO){
      // 피험자조회
      let subject : any = await this.subjectQuery.getSubjectInfo({...params});

      // [1] 메세지 템플릿 조회
      let MSGTemplatesDto : MSGTemplatesDto = await this.commonQuery.getMSGTemplates({ taskTypeCd  });
      let body = MSGTemplatesDto.contents.replace(/#{applicantNm}/g, participant?.PARTICIPANT_NM )    //이름 변경 *
                                        .replace(/#{postTitle}/g, POST_TITLE)
                                        .replace(/#{applyCounselDate}/g, applyCounselDate || '')
                                        .replace(/#{applyCounselTime}/g, applyCounselTime || '')
                                        .replace(/#{organizationNm}/g, organization?.ORGANIZATION_NM || '')
                                        .replace(/#{contactNo}/g, organization?.CONTACT_NO || '')
                                        .replace(/#{APPLY_COUNSEL_DATE}/g, counselOrigin?.APPLY_COUNSEL_DATE || '')
                                        .replace(/#{APPLY_COUNSEL_TIME}/g, counselOrigin?.APPLY_COUNSEL_TIME || '')
                                        .replace(/#{subjectNm}/g, subject?.SUBJECT_NM || '')
                                        .replace(/#{participantNm}/g, participant?.PARTICIPANT_NM || '')
                                        .replace(/#{counselUrl}/g, counselUrl || '')


      let responseData :any ;
      if(subject?.APPLICANT_MOBILE_NO){
        let smsSendDto:SMSSendDto = {
          SMSType: MSGTemplatesDto.msgTypeCd,
          smsSenderNo: MSGTemplatesDto.sender,
          receiveNo: participant?.MOBILE_NO,
          subject: MSGTemplatesDto.title,
          content: body
        } 
    
        responseData = await this.SMSSender.sendSMS(smsSendDto)
      }
      
      return responseData
    }
  }

  
}
