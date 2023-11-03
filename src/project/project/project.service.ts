import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { ParticipantService } from '../participant/participant.service';
import { ProjectQuery } from './project.queries';
import { ExaminationService } from '../examination/examination.service';
import { CommonQuery } from 'src/common/common.queries';
import { ScreeningQuery } from '../screening/screening.queries';
import { ConsentQuery } from '../consent/consent.queries';
import { CounselQuery } from '../counsel/counsel.queries';
import moment from 'moment';
import { MemberQuery } from 'src/member/member.queries';

@Injectable()
export class ProjectService {
  constructor(
    private projectQuery: ProjectQuery,
    private commonQuery: CommonQuery,
    private participantService: ParticipantService,
    private examinationService: ExaminationService,
    private screeningQuery: ScreeningQuery,
    private consentQuery: ConsentQuery,
    private counselQuery: CounselQuery,
    private memberQuery: MemberQuery,
  ) {}

  /*************************************************
   * 프로젝트 리스트 조회
   * 
   * @returns 전체 프로젝트 리스트 
   ************************************************/
  async getProjectList(params : any) {
    let { props , transaction } = params
    let { page, pageLength, whereOptions,orderOptions , member} = props;
    let { isLogin , memberId} = JSON.parse(member)
    page = page === 0 ? 1 : page;
    const offset = (page - 1) * pageLength;

    /** ORDER OPTION */
    let orderOptionString = '';
    if(orderOptions != undefined){
      const orderOptionArr = orderOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        return items.column_name + ' ' + items.orderOption.toString();
      });

      if (orderOptionArr.length > 0) {
        orderOptionString = ' ORDER BY ' + orderOptionArr.join(', ') ;
      }
    }else {
      orderOptionString = ' ORDER BY tp.ID DESC';
    }


    // 키워드
    let keywordCode 
    let searchObjKeyword = whereOptions.find((strItems) => JSON.parse(strItems)?.where_type === 'like');
    if(searchObjKeyword){
      let items = JSON.parse(searchObjKeyword);
      let temp = { groupCd : 'KEYWORD' , keyword : items.where_value }
      keywordCode = await this.commonQuery.getCommonCdKeyword({...params , props:temp});
    }

    
    
      

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = [];
    if (whereOptions != undefined) {
      whereOptionArr = whereOptions.map((strItems) => {
        let items = JSON.parse(strItems);

        // like %%
        if(items.where_type === 'like'){          
          // - 모집공고명 : 모집공고 제목에서 검색 
          // - 내용 : 임상시험 목적, 임상시험 용도, 선정기준, 제외기준, 키워드에서 텍스트 검색
          if(items.where_key === 'CONTENTS'){
            return `
                      (
                        TRIAL_PURPOSE like '%${items.where_value.toString()}%' 
                        OR TRIAL_USAGE like '%${items.where_value.toString()}%'
                        OR SELECTION_INFO like '%${items.where_value.toString()}%'
                        OR CONSTRAINT_INFO like '%${items.where_value.toString()}%'
                        OR KEYWORD_LIST like '%${keywordCode}%'
                      )
                   `;
          }
          else{
            return `${items.where_key} like '%${items.where_value.toString()}%'`;
          }
        } 

        // =
        else 
        if(items.where_type === 'equal'){
          return `${items.where_key} = '${items.where_value.toString()}'`;
        }

        // between
        else
        if(items.where_type === 'between'){
          const today = `DATE_FORMAT(NOW(),'%Y-%m-%d')`

          // 모집 예정
          if(items.where_value === 'DUE'){
            return ` RECRUIT_START_DATE > ${today} `
          }
          // 모집 중
          else 
          if(items.where_value === 'ING'){
            return `TRIAL_CLOSE_YN = 'N' 
                    AND RECRUIT_START_DATE <= ${today} AND RECRUIT_END_DATE >= ${today}
                    AND TRIAL_END_DATE >= ${today} `
          }
          // 모집 종료
          else 
          if(items.where_value === 'END'){
            return `( TRIAL_CLOSE_YN = 'Y' 
                      OR RECRUIT_END_DATE < ${today} 
                      OR TRIAL_END_DATE < ${today} )`
          }
          // 전체
          else 
          if(items.where_value === 'ALL'){
            return `tp.ID IS NOT NULL`
          }
        }
      });
    }
    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }

    /* SUBQUERY OPTION */
    let subQueryString = `'N'`;
    if(isLogin){
      subQueryString = `IF((SELECT tms.SCRAP_DTM  FROM TB_MEMBER_SCRAP tms WHERE tms.PROTOCOL_NO = tp.PROTOCOL_NO AND tms.MEMBER_LOGIN_ID = '${memberId}'), 'Y' , 'N' )`
    }

    /*
     * 모집 공고 출력 조건
     * 1. DELETE_YN =  N 삭제여부
     * 2. DISPLAY_YN = Y 공고게시 여부
     * 3. POST_DATE 공고게시일
     * 4. STATUS_CD = 작성완료
     */
    //[1] 모집공고 조회
    let projectList: any = await this.projectQuery.getProjectList({
      ...params
      , offset, pageLength
      , whereOptionString, orderOptionString , subQueryString
    });
    //[2] 모집공고 토탈 카운트
    let projectTotalCount: any = await this.projectQuery.getProjectTotalCount({
      ...params
      ,whereOptionString, subQueryString
    });

    // [3] 전체 카운트 -> 조건 = 검색어+전체
    let totalWhereOptionString = '';
    let totalWhereOptionArr = [];
    let searchObj
    if(whereOptions != undefined){
      searchObj = whereOptions.find((strItems) => JSON.parse(strItems)?.where_type === 'like');
    }
    if(searchObj){
      let items = JSON.parse(searchObj);
      // 모집공고명 : 모집공고 제목에서 검색 
      // 내용 : 임상시험 목적, 임상시험 용도, 선정기준, 제외기준, 키워드에서 텍스트 검색
      if(items.where_key === 'CONTENTS'){
        totalWhereOptionArr.push(
          `(
              TRIAL_PURPOSE like '%${items.where_value.toString()}%' 
              OR TRIAL_USAGE like '%${items.where_value.toString()}%'
              OR SELECTION_INFO like '%${items.where_value.toString()}%'
              OR CONSTRAINT_INFO like '%${items.where_value.toString()}%'
              OR KEYWORD_LIST like '%${keywordCode}%'
            )`
        )
      }
      else{
        totalWhereOptionArr.push(`${items.where_key} like '%${items.where_value.toString()}%'`)
      }
    }
    totalWhereOptionArr.push(`tp.ID IS NOT NULL`)
    if (totalWhereOptionArr.length > 0) {
      totalWhereOptionString = ' AND ' + totalWhereOptionArr.join(' AND ');
    } else {
      totalWhereOptionString = ' ';
    }

    let projectTotalList: any = await this.projectQuery.getProjectList({
      ...params
      , offset:0, pageLength:100000
      , whereOptionString:totalWhereOptionString
      , orderOptionString , subQueryString
    });
    // 모집중/모집예정/모집종료/전체 카운트
    const nowDt = moment().format('YYYY-MM-DD') 
    const allCount = projectTotalList?.length
    const ingCount = projectTotalList?.filter(x=>x.TRIAL_CLOSE_YN === 'N'
                                              && x.RECRUIT_START_DATE <= nowDt 
                                              && x.RECRUIT_END_DATE >= nowDt
                                              && x.TRIAL_END_DATE >= nowDt )?.length
    const dueCount = projectTotalList?.filter(x=>x.RECRUIT_START_DATE > nowDt).length
    const endCount = projectTotalList?.filter(x=>x.TRIAL_CLOSE_YN === 'Y' 
                                              || x.RECRUIT_END_DATE < nowDt 
                                              || x.TRIAL_END_DATE < nowDt).length

    for(let project of projectList){
      props['protocolNoOrigin'] = project.PROTOCOL_NO

      // [2] 참여 기관/연구자
      const organizationList = await this.participantService.getProjectOrganizationInfo({...params}); 
      project['organizationList'] = organizationList
      
      // [3] 모집 조건
      const constraintList = await this.projectQuery.getProjectConstraintList({...params}); 
      project['constraintList'] = constraintList

      // [4] 키워드
      props['groupCd'] = 'KEYWORD'
      let keywords = JSON.parse(project.KEYWORD_LIST)
      let keywordCodeList = []
      if(keywords){
        for(let key of keywords){
          props['commCd'] = key
          const keywordCode= await this.commonQuery.getCommonCodeValue({...params}); 
          if(keywordCode){
            keywordCodeList.push(keywordCode)
          }else{
            keywordCodeList.push({'COMM_CD_NM' : key})
          }
        }
      }
      project['keywordCodeList'] = keywordCodeList

    }

    // if (projectList.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: projectList,
        totalCount: projectTotalCount,
        statusCount : {
          ingCount : ingCount,
          dueCount : dueCount,
          endCount : endCount,
          allCount : allCount
        }
      };
    // } else {
    //   return {
    //     statusCode: 10000,
    //     message: '등록된 프로젝트가 없습니다.',
    //     data: [],
    //     totalCount: 0,
    //     statusCount : {
    //       ingCount : 0,
    //       dueCount : 0,
    //       endCount : 0,
    //       allCount : 0
    //     }
    //   };
    // }
  }

  /*************************************************
   * 관심 키워드 리스트 조회
   * 
   * @returns  관심 키워드 리스트
   ************************************************/
  async getInterestList(params : any) {
    let { props , member , transaction } = params
    let { memberId }  = member
    
    // [1] 멤버 조회
    props['loginId'] = member?.memberId
    let memberInfo: any = await this.memberQuery.getMemberByLoginId({...params});
    
    // [2] 키워드 조합
    const keywords = JSON.parse(memberInfo?.KEYWORD_LIST)
    let keywordOptionString = '';
    let keywordOptionArr = [];
    if(keywords && keywords?.length > 0){
      keywordOptionArr = keywords.map(item=>{
        return `KEYWORD_LIST LIKE '%${item}%'`
      })
    }

    if (keywordOptionArr.length > 0) {
      keywordOptionString = ' AND ( ' + keywordOptionArr.join(' OR ') + ' )' ;
    } else {
      keywordOptionString = ' ';
    }

    let orderOptionString = 'ORDER BY POST_START_DATE DESC'
    let subQueryString = `IF((SELECT tms.SCRAP_DTM  FROM TB_MEMBER_SCRAP tms WHERE tms.PROTOCOL_NO = tp.PROTOCOL_NO AND tms.MEMBER_LOGIN_ID = '${memberId}'), 'Y' , 'N' )`
    let whereOptionString = `AND`
    whereOptionString += `(`
    // 모집예정
    whereOptionString += `  RECRUIT_START_DATE > DATE_FORMAT(NOW(),'%Y-%m-%d') `
    whereOptionString += `OR`
    // 모집중
    whereOptionString += `  ( RECRUIT_START_DATE <= DATE_FORMAT(NOW(),'%Y-%m-%d') AND RECRUIT_END_DATE >= DATE_FORMAT(NOW(),'%Y-%m-%d')
                              AND TRIAL_END_DATE >= DATE_FORMAT(NOW(),'%Y-%m-%d'))`
    whereOptionString += `)`
    // 키워드
    whereOptionString += keywordOptionString


    //[1] 모집공고 조회
    let projectList: any = await this.projectQuery.getProjectList({
      ...params
      , offset : 0, pageLength : 5
      , whereOptionString, orderOptionString , subQueryString
    });
    //[1] 모집공고 토탈 카운트
    let projectTotalCount: any = await this.projectQuery.getProjectTotalCount({
      ...params
      ,whereOptionString, subQueryString
    });

    for(let project of projectList){
      props['protocolNoOrigin'] = project.PROTOCOL_NO

      // [2] 참여 기관/연구자
      const organizationList = await this.participantService.getProjectOrganizationInfo({...params}); 
      project['organizationList'] = organizationList
      
      // [3] 모집 조건
      const constraintList = await this.projectQuery.getProjectConstraintList({...params}); 
      project['constraintList'] = constraintList

      // [4] 키워드
      props['groupCd'] = 'KEYWORD'
      let keywords = JSON.parse(project.KEYWORD_LIST)
      let keywordCodeList = []
      if(keywords){
        for(let key of keywords){
          props['commCd'] = key
          const keywordCode= await this.commonQuery.getCommonCodeValue({...params}); 
          if(keywordCode){
            keywordCodeList.push(keywordCode)
          }else{
            keywordCodeList.push({'COMM_CD_NM' : key})
          }
        }
      }
      project['keywordCodeList'] = keywordCodeList
    }

    if (projectList.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        keywords:keywords,
        data: projectList,
        totalCount: projectTotalCount,
      };
    } else {
      return {
        statusCode: 10000,
        message: '등록된 관심 리스트가 없습니다.',
        keywords:keywords,
        data: [],
        totalCount: 0,
      };
    }

  }

  /*************************************************
   * 프로젝트 스크랩 
   * 
   * @param 
   * @returns 프로젝트 스크랩 
   ************************************************/
  async insertScrap(params: any) {
    let { props , member , transaction } = params;
    let { id  , loginYn , memberId } = props

    let selectStr = `,'N' AS APPLY_YN`;
    if(loginYn === 'Y'){
      selectStr = `,(SELECT IF(COUNT(ts.ID) > 0 , 'Y' , 'N') FROM TB_SUBJECT ts WHERE tp.PROTOCOL_NO = ts.PROTOCOL_NO AND ts.MEMBER_LOGIN_ID = '${memberId}') AS APPLY_YN`
    }

    // [1] 프로젝트
    props['selectStr'] = selectStr
    let project: any = await this.projectQuery.getProjectById({...params});
    props['protocolNo'] = project.PROTOCOL_NO

    // [2] 스크랩 조회
    const scrap: any = await this.projectQuery.getProjectScrap({...params}); 
    if(scrap){
      // 삭제
      await this.projectQuery.deleteScrap({...params}); 
    }else{
      // 생성
      const result: any = await this.projectQuery.insertScrap({...params}); 
    }


    if(scrap){
      return {
        statusCode: 10000,
        message: '스크랩 취소를 성공하였습니다.',
      };
    }else{
      return {
        statusCode: 10000,
        message: '스크랩을 성공하였습니다.',
      };
    }
    
    
  }
  
  /*************************************************
   * 프로젝트 상세
   * 
   * @returns  프로젝트 상세
   ************************************************/
  async getProjectInfo(params : any) {
    let {props , transaction} = params
    let { id  , loginYn , memberId } = props

    // APPLY_STATUS_CD * 1개라고 가정 LIMIT 1
    let selectStr = `,'N' AS APPLY_YN 
                     , '' AS APPLY_STATUS_CD `;
    if(loginYn === 'Y'){
      selectStr = `,(SELECT IF(COUNT(ts.ID) > 0 , 'Y' , 'N') FROM TB_SUBJECT ts WHERE tp.PROTOCOL_NO = ts.PROTOCOL_NO AND ts.MEMBER_LOGIN_ID = '${memberId}') AS APPLY_YN
                   ,(SELECT ts.STATUS_CD FROM TB_SUBJECT ts WHERE tp.PROTOCOL_NO = ts.PROTOCOL_NO AND ts.MEMBER_LOGIN_ID = '${memberId}' LIMIT 1) AS APPLY_STATUS_CD`
    }
    
    // [1] 프로젝트
    props['selectStr'] = selectStr
    let project: any = await this.projectQuery.getProjectById({...params});
    props['protocolNoOrigin'] = project.PROTOCOL_NO
    // [2] 참여 기관/연구자
    const organizationList = await this.participantService.getProjectOrganizationInfo({...params}); 
    project['organizationList'] = organizationList
    // [3] 문서
    const documentList = await this.projectQuery.getProjectDocumentList({...params}); 
    project['documentList'] = documentList
    // [4] 모집 조건
    const constraintList = await this.projectQuery.getProjectConstraintList({...params}); 
    project['constraintList'] = constraintList
    // [5] 문진
    const examinationList = await this.examinationService.getProjectExaminationList({...params}); 
    project['examinationList'] = examinationList
    // [6] 스크랩정보
    if(loginYn === 'Y'){
      props['protocolNo'] = project.PROTOCOL_NO
      const scrapInfo: any = await this.projectQuery.getProjectScrap({...params , member : {memberId : memberId} }); 
      project['scrapYn'] = scrapInfo ? 'Y' : 'N'
    }
    // [7] 키워드
    props['groupCd'] = 'KEYWORD'
    let keywords = JSON.parse(project.KEYWORD_LIST)
    let keywordCodeList = []
    if(keywords){
      for(let key of keywords){
        props['commCd'] = key
        const keywordCode= await this.commonQuery.getCommonCodeValue({...params}); 
        if(keywordCode){
          keywordCodeList.push(keywordCode)
        }else{
          keywordCodeList.push({'COMM_CD_NM' : key})
        }
      }
    }
    project['keywordCodeList'] = keywordCodeList

    if(project){
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: project
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
    
  }

  /*****************[마이페이지]************************/
  /*************************************************
   * 내가 참여신청한 프로젝트 리스트 (마이페이지)
   * 
   * @returns  내가 참여신청한 프로젝트 리스트
   ************************************************/
  async getMyProjectList(params : any) {
    let {props , member,  transaction} = params

    // [1] 프로젝트 리스트
    let projects : any = await this.projectQuery.getMyProjectList({...params});

    for(let item of projects){
      // [2] 스크리닝 정보
      props['subjectId'] = item.SUBJECT_ID
      let screening : any = await this.screeningQuery.getSubjectScreening({...params});
      item['screening'] = screening ?? {}

      // [3] 동의서 리스트 정보
      props['organizationCd'] = item.ORGANIZATION_CD
      props['protocolNo'] = item.PROTOCOL_NO
      let consentSignList : any = await this.consentQuery.getConsentSignListBySubjectId({...params});
      item['consentSignList'] = consentSignList ?? []

      // [4] 상담 리스트 (전체)
      let counselList : any = await this.counselQuery.getSubjectCounsel({...params});
      item['counselList'] =counselList ?? []
    }


    return {
      statusCode: 10000,
      message: '정상적으로 조회되었습니다.',
      data: projects
    };
  }
  /*************************************************
   * 내가 참여 상태
   * 
   * @returns  내가 참여 상태
   ************************************************/
  async getMyApplyStatus(params : any) {
    let {props , member,  transaction} = params

    // 내 참여 프로젝트 리스트
    let projects : any = await this.projectQuery.getMyProjectList({...params});

    const today = moment().format('YYYY-MM-DD')
    let result = projects?.filter(x=> (x.SUBJECT_STATUS_CD === 'APPLY' || x.SUBJECT_STATUS_CD === 'RESERVATION')
                                    && x.TRIAL_CLOSE_YN === 'N'
                                    && x.TRIAL_END_DATE >= today
                                  )

    return {
      statusCode: 10000,
      message: '정상적으로 조회되었습니다.',
      data: result
    };
  }

}
