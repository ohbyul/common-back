import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class CounselQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 신청자 비대면상담 정보 조회 - (전체) 
   * 
   * @returns  신청자 비대면상담
   ************************************************/
  async getSubjectCounsel(params : any) {
    let { props, transaction } = params;
    let { subjectId } = props
    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tsc.ID 
                ,tsc.ORGANIZATION_CD
                ,tog.ORGANIZATION_NM
                ,tsc.PROTOCOL_NO 
                ,tsc.SUBJECT_ID 
                ,CAST(AES_DECRYPT(UNHEX(ts.SUBJECT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS SUBJECT_NM
                ,tsc.APPLY_COUNSEL_DATE 
                ,tsc.APPLY_COUNSEL_TIME 
                ,tsc.STATUS_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tsc.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'COUNSEL_STATUS') AS STATUS_CD_NM
                ,tsc.REQUEST_TYPE_CD 
                ,tsc.WRITE_USER_LOGIN_ID 
                ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                  FROM TB_USER tu 
                 WHERE tu.LOGIN_ID = tsc.WRITE_USER_LOGIN_ID
               ) AS WRITE_USER_NM
                ,tsc.APPLY_REASON_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tsc.APPLY_REASON_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'APPLY_REASON') AS APPLY_REASON_CD_NM
                ,tsc.PARTICIPANT_ID 
                ,(SELECT tpp.PARTICIPANT_NM FROM TB_PROJECT_PARTICIPANT tpp WHERE tpp.ID = tsc.PARTICIPANT_ID) AS PARTICIPANT_NM
                ,CONCAT(tsc.COUNSEL_URL,'/',(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = 'SUBJECT' AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'COUNSEL_CONNECT_TYPE')) COUNSEL_URL
                ,tsc.COUNSEL_PASSWORD
                ,tsc.COUNSEL_START_DTM
                ,tsc.COUNSEL_END_DTM
                ,tsc.COUNSEL_RECORD_URL
                ,tsc.CREATE_MEMBER_LOGIN_ID 
                ,tsc.CREATE_USER_LOGIN_ID 
                ,tsc.CREATE_DTM 
                ,tsc.MODIFY_MEMBER_LOGIN_ID 
                ,tsc.MODIFY_USER_LOGIN_ID 
                ,tsc.MODIFY_MEMBER_DTM 
                ,tsc.MODIFY_USER_DTM 
          FROM TB_SUBJECT_COUNSEL tsc 
          INNER JOIN TB_ORGANIZATION tog ON tsc.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
          INNER JOIN TB_SUBJECT ts ON ts.ID = tsc.SUBJECT_ID 
          WHERE 1=1
            AND tsc.SUBJECT_ID = :id
          ORDER BY tsc.APPLY_COUNSEL_DATE DESC
        `,  
        { 
          replacements : {
            id:subjectId,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result;
  }

  /*************************************************
   * 비대면상담 등록
   * 
   * @returns  비대면상담 등록
   ************************************************/
  async insertCounsel(params : any) {
    let { props, member , transaction} = params
    let { memberId } = member
    let { projectId , protocolNo , subjectId , organizationCd
      , counselId
      , applyCounselDate , applyCounselTime , requestTypeCd 
      , applyReasonCd , participantId , statusCd  
      , isCreate 
    } = props

    // TODO WRITE_USER_LOGIN_ID


    let result : any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_SUBJECT_COUNSEL ( 
            SUBJECT_ID 
            ,ORGANIZATION_CD
            ,PROTOCOL_NO
            ,APPLY_COUNSEL_DATE 
            ,APPLY_COUNSEL_TIME 
            ,REQUEST_TYPE_CD
            ,WRITE_USER_LOGIN_ID
            ,APPLY_REASON_CD
            ,PARTICIPANT_ID
            ,STATUS_CD
            ,CREATE_DTM , CREATE_MEMBER_LOGIN_ID
      )VALUES( :subjectId  
            ,:organizationCd
            ,:protocolNo
            ,:applyCounselDate
            ,:applyCounselTime
            ,:requestTypeCd
            ,null
            ,:applyReasonCd
            ,:participantId
            ,:statusCd
            ,now() , :memberId
          )
      `,
      {
        replacements: {
          subjectId: subjectId,
          protocolNo:protocolNo,
          organizationCd:organizationCd,
          applyCounselDate: applyCounselDate,
          applyCounselTime: applyCounselTime,
          requestTypeCd:requestTypeCd,
          participantId:participantId ?? null,
          applyReasonCd:applyReasonCd,
          statusCd: statusCd,
          memberId:memberId
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
        raw: true 
      },
    );

    return result[0];
  }
  

  /*************************************************
   * 비대면상담 예약 정보 수정
   * 
   * @param createProjectDto
   * @returns 비대면상담 예약 정보 수정 성공여부
   ************************************************/
  async updateCounsel(params: any) {
    let { props , member , transaction } = params;
    let { memberId } = member
    let { projectId , subjectId , organizationCd
      , counselId
      , applyCounselDate , applyCounselTime , applyReasonCd , participantId , statusCd  
      , isCreate 
    } = props


    let result : any = await this.CommonModel.sequelize.query(
      `
      UPDATE TB_SUBJECT_COUNSEL 
         SET APPLY_COUNSEL_DATE = :applyCounselDate
            ,APPLY_COUNSEL_TIME = :applyCounselTime
            ,PARTICIPANT_ID = :participantId
            ,APPLY_REASON_CD = :applyReasonCd
            ,STATUS_CD = :statusCd
            ,MODIFY_MEMBER_DTM  = now()
            ,MODIFY_MEMBER_LOGIN_ID = :memberId
      WHERE 1=1
        AND ID = :counselId
      `,
      {
        replacements: {
          applyCounselDate: applyCounselDate,
          applyCounselTime: applyCounselTime,
          participantId:participantId ?? null,
          applyReasonCd:applyReasonCd,
          statusCd: statusCd,
          memberId: memberId,
          counselId:counselId,
        },
        type: QueryTypes.UPDATE, transaction,
      },
    );

    return result[0];
  }

  /*************************************************
   * 신청자 비대면상담 이력 조회
   * 
   * @returns  신청자 비대면상담
   ************************************************/
  async getSubjectCounselHistory(params : any) {
    let { props, member, transaction } = params;
    let { subjectId } = props

    const resultList: any = await this.CommonModel.sequelize.query(
        `
          SELECT tsc.ID 
                ,tsc.ORGANIZATION_CD
                ,tog.ORGANIZATION_NM
                ,tsc.PROTOCOL_NO 
                ,tsc.SUBJECT_ID 
                ,ts.MEMBER_LOGIN_ID 
                ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_NM
                ,CAST(AES_DECRYPT(UNHEX(ts.SUBJECT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS SUBJECT_NM
                ,tsc.APPLY_COUNSEL_DATE 
                ,tsc.APPLY_COUNSEL_TIME 
                ,tsc.STATUS_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tsc.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'COUNSEL_STATUS') AS STATUS_CD_NM
                ,tsc.REQUEST_TYPE_CD 
                ,tsc.WRITE_USER_LOGIN_ID 
                ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                    FROM TB_USER tu 
                   WHERE tu.LOGIN_ID = tsc.WRITE_USER_LOGIN_ID 
                 ) AS WRITE_USER_NM
                ,tsc.APPLY_REASON_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tsc.APPLY_REASON_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'APPLY_REASON') AS APPLY_REASON_CD_NM
                ,tsc.PARTICIPANT_ID 
                ,tpp.ROLE_CD 
                ,tpp.PARTICIPANT_EMAIL 
                ,tpp.PARTICIPANT_NM 
                ,CONCAT(tsc.COUNSEL_URL,'/',(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = 'SUBJECT' AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'COUNSEL_CONNECT_TYPE')) COUNSEL_URL
                ,tsc.COUNSEL_PASSWORD
                ,tsc.COUNSEL_START_DTM
                ,tsc.COUNSEL_END_DTM
                ,tsc.COUNSEL_RECORD_URL
                ,tsc.CREATE_MEMBER_LOGIN_ID 
                ,tsc.CREATE_USER_LOGIN_ID 
                ,tsc.CREATE_DTM 
                ,tsc.MODIFY_MEMBER_LOGIN_ID 
                ,tsc.MODIFY_USER_LOGIN_ID 
                ,tsc.MODIFY_MEMBER_DTM 
                ,tsc.MODIFY_USER_DTM 
          FROM TB_SUBJECT_COUNSEL tsc 
          INNER JOIN TB_ORGANIZATION tog ON tsc.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
          INNER JOIN TB_SUBJECT ts ON ts.ID = tsc.SUBJECT_ID AND ts.STATUS_CD = 'RESERVATION'
          LEFT JOIN TB_PROJECT_PARTICIPANT tpp ON tpp.ID = tsc.PARTICIPANT_ID 
          WHERE 1=1
            AND tsc.SUBJECT_ID = :id
          ORDER BY tsc.CREATE_DTM DESC
        `,  
        { 
          replacements : {
            id:subjectId,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return resultList;
  }

}
