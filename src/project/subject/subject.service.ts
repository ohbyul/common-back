import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';

import { ExaminationService } from '../examination/examination.service';
import { ScreeningQuery } from '../screening/screening.queries';
import { SubjectQuery } from './subject.queries';
import { ScreeningService } from '../screening/screening.service';
import { ProjectQuery } from '../project/project.queries';
import { ConsentQuery } from '../consent/consent.queries';
import { CounselQuery } from '../counsel/counsel.queries';
import moment from 'moment';
import { SurveyService } from '../survey/survey.service';

@Injectable()
export class SubjectService {
  constructor(
    private subjectQuery: SubjectQuery,
    private screeningQuery: ScreeningQuery,
    private examinationService: ExaminationService,
    private screeningService: ScreeningService,
    private projectQuery: ProjectQuery,
    private consentQuery: ConsentQuery,
    private counselQuery: CounselQuery,
    private surveyService: SurveyService,
  ) {}

  /*************************************************
   * 모집공고 임상시험 신청 - 공개포탈
   * 
   * @returns 모집공고 임상시험 신청
   ************************************************/
  async insertSubject(params : any) {
    let { props , member , transaction } = params;
    let { protocolNo , organizationCd 
      , applicantTypeCd 
      , applicantNm , applicantMobileNo , applicantGender , applicantBirthDate
      , subjectRelation , subjectNm , subjectBirthDate , subjectGender 
      , prenancyYn 
      , applyTypeCd 
      , statusCd
    } = props

    // [1] 피험자 생성
    if(applicantTypeCd==='SUBJECT'){
      props['subjectRelation'] = '본인'
      props['subjectNm'] = applicantNm
      props['subjectBirthDate'] = applicantBirthDate
      props['subjectGender'] = applicantGender
    }
    let subject : any = await this.subjectQuery.insertSubject({...params});

    // [2] 스크리닝 생성
    props['subjectId'] = subject
    let screening: any = await this.screeningQuery.insertScreening({...params});

    // [2-2] 스크리닝 이력생성
    await this.screeningService.insertScreeningHistory({...params});

    // [3] 문진항목결과 생성
    await this.examinationService.insertExaminationResult({...params});

    // [4] SMS send _ taskTypeCd : 1001 임상실험 신청
    props['taskTypeCd'] = '1001'
    // 프로젝트조회
    let project: any = await this.projectQuery.getProjectByProtocolNo({...params , whereStrOptions:''});
    props['project'] = project;
    let responseData : any = await this.screeningService.sendSmsScreening({...params})


    if (subject) {
      return {
        statusCode: 10000,
        message: '정상적으로 내역이 저장되었습니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }
  

  /*************************************************
   * 신청자 상세
   * 
   * @returns  신청자 상세
   ************************************************/
  async getSubjectInfo(params : any) {
    let { props , member , transaction } = params;
    let { subjectId , id } = props

    // [0] 프로젝트 ID 로 조회 PROTOCOL_NO
    let project: any = await this.projectQuery.getProjectById({...params});
    const protocolNo = project.PROTOCOL_NO
    props['protocolNoOrigin'] = protocolNo
    
    // [1] 신청자 정보
    let subject : any = await this.subjectQuery.getSubjectInfo({...params});
    subject['project'] = project
    // [2] 동의서 정보
    props['organizationCd'] = subject.ORGANIZATION_CD
    props['protocolNo'] = project.PROTOCOL_NO
    let consentSignList : any = await this.consentQuery.getConsentSignListBySubjectId({...params});
    subject['consentSignList'] = consentSignList ?? []

    // [3] exam 정보
    let examinationList : any = await this.examinationService.getSubjectExaminationResult({...params});
    subject['examinationList'] = examinationList

    // [4] 스크리닝 정보
    let screening : any = await this.screeningQuery.getSubjectScreening({...params});
    subject['screening'] = screening ?? {}

    // [5] 상담 리스트 (전체)
    let counselList : any = await this.counselQuery.getSubjectCounsel({...params});
    subject['counselList'] =counselList ?? []
    
    //[6] 임상완료설문
    let surveyList: any = await this.surveyService.getProjectSurveyList({...params});
    subject['surveyList'] =surveyList ?? []
    
    if (subject) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: subject,
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * 신청자 업데이트 [상태, 탈락, 취소 , 설문여부]
   * 
   * @param createProjectDto
   * @returns 신청자 업데이트 성공여부
   ************************************************/
  async updateSubjectStatus(params : any) {
    let { props , member , transaction } = params;
    let { subjectId, statusCd 
      , cancelReasonCd ,cancelReasonEtc ,cancelerTypeCd , cancelDtm 
      , projectId
    } = props
    let { memberId } = member

    // 참여취소
    if(statusCd === 'CANCEL'){
      props['cancelDtm'] = moment().format('YYYY-MM-DD HH:mm:ss')
    }

    // [1] 신청자 상태 변경
    await this.subjectQuery.updateSubjectStatusInfo({...params})

    // [2] SMS -취소 문자
    props['taskTypeCd']='1002'
    props['cancelDateTime'] = moment().format('YYYY-MM-DD HH:mm:ss')
    // 서브젝트 ID 조회
    let subject: any = await this.subjectQuery.getSubjectInfo({...params});
    props['applicantMobileNo']=subject?.APPLICANT_MOBILE_NO
    props['applicantNm']=subject?.APPLICANT_NM
    // 프로젝트 ID 로 조회 
    props['id']=projectId
    let project: any = await this.projectQuery.getProjectById({...params});
    props['protocolNo']=project?.PROTOCOL_NO
    props['project']=project

    let responseData : any = await this.screeningService.sendSmsScreening({...params})

    // [3] 스크리닝 이력 생성
    // 동의서 서명 정보
    props['organizationCd'] = subject.ORGANIZATION_CD
    let consentSignList : any = await this.consentQuery.getConsentSignListBySubjectId({...params});
    // 스크리닝 정보
    let screening : any = await this.screeningQuery.getSubjectScreening({...params});

    // signed - 서명중, 서명완료
    consentSignList = consentSignList?.filter(x=>x.STATUS_CD !== null)

    // un-signed
    if(consentSignList.length === 0){
      props['screeningDate']=screening?.SCREENING_DATE
      props['screeningTime']=screening?.SCREENING_TIME
      props['statusCd']='CANCEL'
      props['requestTypeCd'] = 'APPLICANT'
      
      await this.screeningQuery.insertScreeningHistory({...params});

    }

    return {
      statusCode: 10000,
      message: '정상적으로 수정되었습니다.',
    };

  }

}
