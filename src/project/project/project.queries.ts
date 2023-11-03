import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class ProjectQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];
  
  /*************************************************
   * 프로젝트 리스트 조회
   * 
   * @returns 전체 프로젝트 리스트 (삭제 포함)
   ************************************************/
  async getProjectList(params : any) {
    let { offset, pageLength, whereOptionString, orderOptionString
      , transaction , subQueryString
    } = params;

    const resultList: any = await this.CommonModel.sequelize.query(
        ` SELECT * 
            FROM (
                SELECT tp.ID 
                      ,tp.PROTOCOL_NO AS PROTOCOL_NO
                      ,tpo.ORGANIZATION_CD AS ORGANIZATION_CD
                      ,(SELECT tog.ORGANIZATION_NM FROM TB_ORGANIZATION tog WHERE tog.ORGANIZATION_CD = tpo.ORGANIZATION_CD ) AS ORGANIZATION_NM
                      ,tp.TRIAL_TITLE AS TRIAL_TITLE
                      ,tp.TRIAL_TITLE_ENG 
                      ,tp.PRODUCT_CD 
                      ,tp.PRODUCT_NM 
                      ,tp.TRIAL_STEP_TYPE_CD 
                      ,tp.TRIAL_START_DATE 
                      ,tp.TRIAL_END_DATE 
                      ,tp.TRIAL_APPROVAL_DATE 
                      ,tp.TRIAL_PURPOSE 
                      ,tp.TRIAL_USAGE 
                      ,tp.NATION_TYPE_CD 
                      ,tp.NATION_DTL_TYPE_CD 
                      ,tp.KEYWORD_LIST 
                      ,tp.POST_TITLE 
                      ,tp.RESEARCH_START_DATE 
                      ,tp.RESEARCH_END_DATE 
                      ,tp.POST_START_DATE 
                      ,tp.POST_END_DATE 
                      ,tp.REWARD_INFO 
                      ,tp.REWARD_DISPLAY_YN 
                      ,tp.SELECTION_INFO 
                      ,tp.CONSTRAINT_INFO 
                      ,tp.DTX_INFO 
                      ,tp.SURVEY_TITLE 
                      ,tp.SURVEY_CONTENTS 
                      ,tp.SURVEY_START_YN 
                      ,tp.WRITE_LOGIN_ID 
                      ,tp.WRITE_DTM 
                      ,tp.STATUS_CD 
                      ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tp.STATUS_CD AND tcc.GROUP_CD = 'PROJECT_STATUS') AS STATUS_CD_NM
                      ,tp.DISPLAY_YN 
                      ,tp.DELETE_YN 
                      ,tp.TRIAL_CLOSE_YN
                      ,(SELECT MIN(RECRUIT_START_DATE) 
                          FROM TB_PROJECT_ORGANIZATION 
                         WHERE PROTOCOL_NO = tp.PROTOCOL_NO 
                           AND RECRUIT_START_DATE IS NOT NULL 
                           AND DELETE_YN = 'N'
                           AND DISPLAY_YN = 'Y' ) AS RECRUIT_START_DATE
                      ,(SELECT MAX(RECRUIT_END_DATE) 
                          FROM TB_PROJECT_ORGANIZATION 
                         WHERE PROTOCOL_NO = tp.PROTOCOL_NO 
                           AND RECRUIT_END_DATE IS NOT NULL 
                           AND DELETE_YN = 'N' 
                           AND DISPLAY_YN = 'Y') AS RECRUIT_END_DATE
                      ,${subQueryString} AS SCRAP_YN
                  FROM TB_PROJECT tp
                INNER JOIN TB_PROJECT_ORGANIZATION tpo ON tpo.PROTOCOL_NO = tp.PROTOCOL_NO AND tpo.PARTICIPANT_TYPE_CD = 'SPONSOR' AND tpo.DELETE_YN = 'N'
                WHERE 1=1
                  AND tp.DELETE_YN = 'N'
                  AND tp.DISPLAY_YN = 'Y'
                  AND tp.STATUS_CD = 'COMPLETE'
              ) tp 
          WHERE 1=1  
            AND POST_START_DATE <= DATE_FORMAT(NOW(),'%Y-%m-%d') 
            AND ( POST_END_DATE >= DATE_FORMAT(NOW(),'%Y-%m-%d') OR POST_END_DATE IS NULL )
            AND RECRUIT_START_DATE IS NOT NULL
            ${whereOptionString}
            ${orderOptionString}
           LIMIT ${offset}, ${pageLength}
        `,  
        { 
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return resultList;
  }

  async getProjectTotalCount(params :any) {
    let { whereOptionString, subQueryString, transaction} = params;

    let totalCount: any = await this.CommonModel.sequelize.query(
        `SELECT COUNT(tp.ID) as totalCount 
           FROM (
                SELECT tp.*
                      ,(SELECT MIN(RECRUIT_START_DATE) 
                          FROM TB_PROJECT_ORGANIZATION 
                         WHERE PROTOCOL_NO = tp.PROTOCOL_NO 
                           AND RECRUIT_START_DATE IS NOT NULL 
                           AND DELETE_YN = 'N'
                           AND DISPLAY_YN = 'Y' ) AS RECRUIT_START_DATE
                      ,(SELECT MAX(RECRUIT_END_DATE) 
                          FROM TB_PROJECT_ORGANIZATION 
                         WHERE PROTOCOL_NO = tp.PROTOCOL_NO 
                           AND RECRUIT_END_DATE IS NOT NULL 
                           AND DELETE_YN = 'N' 
                           AND DISPLAY_YN = 'Y') AS RECRUIT_END_DATE
                      ,${subQueryString} AS SCRAP_YN
                  FROM TB_PROJECT tp 
                  INNER JOIN TB_PROJECT_ORGANIZATION tpo ON tpo.PROTOCOL_NO = tp.PROTOCOL_NO AND tpo.PARTICIPANT_TYPE_CD = 'SPONSOR' AND tpo.DELETE_YN = 'N'
                WHERE 1=1
                  AND tp.DELETE_YN = 'N'
                  AND tp.DISPLAY_YN = 'Y'
                  AND tp.STATUS_CD = 'COMPLETE'
              ) tp 
          WHERE 1=1
            AND POST_START_DATE <= DATE_FORMAT(NOW(),'%Y-%m-%d') 
            AND ( POST_END_DATE >= DATE_FORMAT(NOW(),'%Y-%m-%d') OR POST_END_DATE IS NULL )
            AND RECRUIT_START_DATE IS NOT NULL
            ${whereOptionString}
      `,
        { 
          type: QueryTypes.SELECT,transaction 
        },
      );

    return totalCount[0].totalCount;
  }

  /*************************************************
   * 프로젝트 조회 BY 프로토콜 넘버
   * 
   * @returns  프로젝트 정보
   ************************************************/
  async getProjectByProtocolNo(params : any) {
    let { props , transaction , whereStrOptions} = params
    let { protocolNo } = props
    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tp.ID 
                ,tp.PROTOCOL_NO 
                ,tp.TRIAL_TITLE 
                ,tp.TRIAL_TITLE_ENG 
                ,tp.PRODUCT_CD 
                ,tp.PRODUCT_NM 
                ,tp.TRIAL_STEP_TYPE_CD 
                ,tp.TRIAL_START_DATE 
                ,tp.TRIAL_END_DATE 
                ,tp.TRIAL_APPROVAL_DATE 
                ,tp.TRIAL_PURPOSE 
                ,tp.TRIAL_USAGE 
                ,tp.NATION_TYPE_CD 
                ,tp.NATION_DTL_TYPE_CD 
                ,tp.KEYWORD_LIST 
                ,tp.POST_TITLE 
                ,tp.RESEARCH_START_DATE 
                ,tp.RESEARCH_END_DATE 
                ,tp.POST_START_DATE 
                ,tp.POST_END_DATE 
                ,tp.REWARD_INFO 
                ,tp.REWARD_DISPLAY_YN 
                ,tp.SELECTION_INFO 
                ,tp.CONSTRAINT_INFO 
                ,tp.DTX_INFO 
                ,tp.SURVEY_TITLE 
                ,tp.SURVEY_CONTENTS 
                ,tp.SURVEY_START_YN 
                ,tp.WRITE_LOGIN_ID 
                ,tp.WRITE_DTM 
                ,tp.STATUS_CD 
                ,tp.DISPLAY_YN 
                ,tp.DELETE_YN 
                ,tp.TRIAL_CLOSE_YN
           FROM TB_PROJECT tp 
          WHERE 1=1
            AND tp.PROTOCOL_NO = :protocolNo
            ${whereStrOptions}
        `,  
        { 
          replacements: {
            protocolNo:protocolNo,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result[0];
  }

  /*************************************************
   * 프로젝트 조회 BY 프로젝트 아이디
   * 
   * @returns  프로젝트 정보
   ************************************************/
  async getProjectById(params : any) {
    let { props , transaction} = params
    let { id  , selectStr } = props

    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tp.ID 
                ,tp.PROTOCOL_NO 
                ,tp.TRIAL_TITLE 
                ,tp.TRIAL_TITLE_ENG 
                ,tp.PRODUCT_CD 
                ,tp.PRODUCT_NM 
                ,tp.TRIAL_STEP_TYPE_CD 
                ,tp.TRIAL_START_DATE 
                ,tp.TRIAL_END_DATE 
                ,tp.TRIAL_APPROVAL_DATE 
                ,tp.TRIAL_PURPOSE 
                ,tp.TRIAL_USAGE 
                ,tp.NATION_TYPE_CD 
                ,tp.NATION_DTL_TYPE_CD 
                ,tp.KEYWORD_LIST 
                ,tp.POST_TITLE 
                ,tp.RESEARCH_START_DATE 
                ,tp.RESEARCH_END_DATE 
                ,tp.POST_START_DATE 
                ,tp.POST_END_DATE 
                ,tp.REWARD_INFO 
                ,tp.REWARD_DISPLAY_YN 
                ,tp.SELECTION_INFO 
                ,tp.CONSTRAINT_INFO 
                ,tp.DTX_INFO 
                ,tp.SURVEY_TITLE 
                ,tp.SURVEY_CONTENTS 
                ,tp.SURVEY_START_YN 
                ,tp.WRITE_LOGIN_ID 
                ,tp.WRITE_DTM 
                ,tp.STATUS_CD 
                ,tp.DISPLAY_YN 
                ,tp.DELETE_YN 
                ,tp.TRIAL_CLOSE_YN
                ,(SELECT MIN(RECRUIT_START_DATE) FROM TB_PROJECT_ORGANIZATION WHERE PROTOCOL_NO = tp.PROTOCOL_NO AND RECRUIT_START_DATE IS NOT NULL AND DELETE_YN = 'N' ) AS RECRUIT_START_DATE
                ,(SELECT MAX(RECRUIT_END_DATE) FROM TB_PROJECT_ORGANIZATION WHERE PROTOCOL_NO = tp.PROTOCOL_NO AND RECRUIT_END_DATE IS NOT NULL AND DELETE_YN = 'N' ) AS RECRUIT_END_DATE
                ${selectStr ?? ''}
           FROM TB_PROJECT tp 
          WHERE 1=1
            AND tp.ID = :id
        `,  
        { 
          replacements: {
            id:id,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result[0];
  }

  /*************************************************
   * 프로젝트 스크랩 조회
   * 
   * @param 
   * @returns 프로젝트 스크랩 
   ************************************************/
  async getProjectScrap(params : any) {
    let { props , member , transaction} = params
    let { memberId } = member
    let { id , protocolNo } = props

    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tms.ID 
                ,tms.MEMBER_LOGIN_ID 
                ,tms.PROTOCOL_NO 
                ,tms.SCRAP_DTM 
           FROM TB_MEMBER_SCRAP tms 
          INNER JOIN TB_MEMBER tm ON tm.LOGIN_ID = tms.MEMBER_LOGIN_ID
          WHERE 1=1 
            AND tms.MEMBER_LOGIN_ID = :memberId
            AND tms.PROTOCOL_NO = :protocolNo
        `,  
        { 
          replacements: {
            memberId:memberId, 
            protocolNo:protocolNo
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result[0];
  }

  /*************************************************
   * 프로젝트 스크랩 삭제
   * 
   * @param 
   * @returns 프로젝트 스크랩 삭제
   ************************************************/
  async deleteScrap(params : any) {
    let { props , member , transaction} = params
    let { memberId } = member
    let { id , protocolNo } = props

    const result: any = await this.CommonModel.sequelize.query(
        `
        DELETE FROM TB_MEMBER_SCRAP tms 
        WHERE 1=1
          AND tms.MEMBER_LOGIN_ID = :memberId
          AND tms.PROTOCOL_NO = :protocolNo
        `,  
        { 
          replacements: {
            memberId:memberId,
            protocolNo:protocolNo
          },
          type: QueryTypes.DELETE, transaction,
          mapToModel: true,
          raw: true 
        },
      );
  }

  /*************************************************
   * 프로젝트 스크랩 생성
   * 
   * @param 
   * @returns 프로젝트 스크랩 
   ************************************************/
  async insertScrap(params : any) {
    let { props , member , transaction} = params
    let { memberId } = member
    let { id , protocolNo } = props

    const result: any = await this.CommonModel.sequelize.query(
        `
          INSERT INTO TB_MEMBER_SCRAP ( 
                 MEMBER_LOGIN_ID
                ,PROTOCOL_NO
                ,SCRAP_DTM
                ,CREATE_DTM , CREATE_LOGIN_ID , MODIFY_DTM , MODIFY_LOGIN_ID 
        ) VALUES ( 
                 :memberId
                ,:protocolNo
                , now()
                , now(), :memberId, now(), :memberId
          )
        `,  
        { 
          replacements: {
            memberId:memberId,
            protocolNo:protocolNo
          },
          type: QueryTypes.INSERT, transaction,
          mapToModel: true,
          raw: true 
        },
      );

    return result[0];
  }

  /*************************************************
   * 프로젝트 문서 조회 리스트
   * 
   * @returns  프로젝트 정보
   ************************************************/
  async getProjectDocumentList(params : any) {
    let { props , transaction} = params
    let { protocolNoOrigin } = props
    // 연구계획서 : PLAN, 설명문 : EXPLAN , 공고문 : NOTICE
    const resultList: any = await this.CommonModel.sequelize.query(
        `
          SELECT tpd.ID 
                ,tpd.PROTOCOL_NO 
                ,tpd.VERSION 
                ,tpd.DOCUMENT_TYPE_CD 
                ,tpd.ORIGINAL_FILE_NM 
                ,tpd.SAVE_FILE_NM  
                ,tpd.EXTENSION_NM 
                ,tpd.FILE_PATH 
                ,tpd.WRITE_LOGIN_ID
                ,tu.ORGANIZATION_CD 
                ,tog.ORGANIZATION_NM 
                ,tpd.WRITE_DTM 
                ,tpd.DELETE_YN 
            FROM TB_PROJECT_DOCUMENT tpd 
           INNER JOIN TB_USER tu ON tu.LOGIN_ID = tpd.WRITE_LOGIN_ID
           INNER JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = tu.ORGANIZATION_CD 
           WHERE 1=1
            AND tpd.DELETE_YN = 'N'
            AND tpd.PROTOCOL_NO = :protocolNo
          ORDER BY tpd.WRITE_DTM ASC
        `,  
        { 
          replacements: {
            protocolNo:protocolNoOrigin,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return resultList;
  }

  /*************************************************
   * 프로젝트 모집조건 조회 리스트
   * 
   * @returns  프로젝트 정보
   ************************************************/
  async getProjectConstraintList(params : any) {
    let { props , transaction} = params
    let { protocolNoOrigin } = props

    const resultList: any = await this.CommonModel.sequelize.query(
          `
          SELECT tpc.ID 
                ,tpc.PROTOCOL_NO 
                ,tpc.CONSTRAINT_TYPE_CD 
                ,tpc.CONSTRAINT_VALUE 
                ,tpc.LIMIT_START_AGE 
                ,tpc.LIMIT_END_AGE 
                ,tpc.DISPLAY_YN 
           FROM TB_PROJECT_CONSTRAINT tpc 
          WHERE 1=1
            AND tpc.PROTOCOL_NO = :protocolNo
        `,  
        { 
          replacements: {
            protocolNo:protocolNoOrigin,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return resultList;
  }

  /*************************************************
   * 내가 참여신청한 프로젝트 리스트 (마이페이지)
   * 
   * @returns  내가 참여신청한 프로젝트 리스트
   ************************************************/
  async getMyProjectList(params : any) {
    let {props , member,  transaction} = params
    let { memberId } = member
    const resultList: any = await this.CommonModel.sequelize.query(
        ` 
          SELECT tp.ID 
                ,tp.PROTOCOL_NO AS PROTOCOL_NO
                ,tp.TRIAL_TITLE AS TRIAL_TITLE
                ,tp.TRIAL_TITLE_ENG 
                ,tp.PRODUCT_CD 
                ,tp.PRODUCT_NM 
                ,tp.TRIAL_STEP_TYPE_CD 
                ,tp.TRIAL_START_DATE 
                ,tp.TRIAL_END_DATE 
                ,tp.TRIAL_APPROVAL_DATE 
                ,tp.TRIAL_PURPOSE 
                ,tp.TRIAL_USAGE 
                ,tp.NATION_TYPE_CD 
                ,tp.NATION_DTL_TYPE_CD 
                ,tp.KEYWORD_LIST 
                ,tp.POST_TITLE 
                ,tp.RESEARCH_START_DATE 
                ,tp.RESEARCH_END_DATE 
                ,tp.POST_START_DATE 
                ,tp.POST_END_DATE 
                ,tp.REWARD_INFO 
                ,tp.REWARD_DISPLAY_YN 
                ,tp.SELECTION_INFO 
                ,tp.CONSTRAINT_INFO 
                ,tp.DTX_INFO 
                ,tp.SURVEY_TITLE 
                ,tp.SURVEY_CONTENTS 
                ,tp.SURVEY_START_YN 
                ,tp.WRITE_LOGIN_ID 
                ,tp.WRITE_DTM 
                ,tp.STATUS_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tp.STATUS_CD AND tcc.GROUP_CD = 'PROJECT_STATUS') AS STATUS_CD_NM
                ,tp.DISPLAY_YN 
                ,tp.DELETE_YN 
                ,tp.TRIAL_CLOSE_YN
                ,ts.ID AS SUBJECT_ID
                ,ts.ORGANIZATION_CD 
                ,ts.APPLICANT_TYPE_CD 
                ,ts.APPLY_DTM 
                ,ts.MEMBER_LOGIN_ID 
                ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_NM
                ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_MOBILE_NO), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_MOBILE_NO
                ,ts.SUBJECT_RELATION 
                ,CAST(AES_DECRYPT(UNHEX(ts.SUBJECT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS SUBJECT_NM
                ,CAST(AES_DECRYPT(UNHEX(ts.SUBJECT_BIRTH_DATE), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS SUBJECT_BIRTH_DATE
                ,ts.SUBJECT_GENDER 
                ,ts.PRENANCY_YN 
                ,ts.APPLY_TYPE_CD
                ,ts.APPLY_DTM 
                ,ts.WRITE_USER_LOGIN_ID 
                ,ts.STATUS_CD AS SUBJECT_STATUS_CD
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = ts.STATUS_CD AND tcc.GROUP_CD = 'SUBJECT_STATUS') AS SUBJECT_STATUS_CD_NM
                ,ts.CANCEL_REASON_CD 
                ,ts.CANCEL_REASON_ETC
                ,ts.CANCELER_TYPE_CD
                ,ts.CANCEL_USER_LOGIN_ID
                ,ts.CANCEL_DTM
                ,ts.REJECT_USER_LOGIN_ID
                ,ts.REJECT_DTM
                ,ts.SURVEY_YN
                ,ts.SURVEY_WRITE_DTM
            FROM TB_PROJECT tp
           INNER JOIN TB_SUBJECT ts ON ts.PROTOCOL_NO = tp.PROTOCOL_NO 
                                    AND ts.MEMBER_LOGIN_ID = :memberId
           WHERE 1=1
             AND tp.DELETE_YN = 'N'
             AND tp.DISPLAY_YN = 'Y'
             AND tp.STATUS_CD = 'COMPLETE' 
           ORDER BY ts.APPLY_DTM DESC
        `,  
        { 
          replacements: {
            memberId,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return resultList;
  }
 
}
