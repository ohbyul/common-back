import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import moment from 'moment';
import { randomBytes } from 'crypto';

@Injectable()
export class SubjectQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 모집공고 임상시험 신청 - 공개포탈
   * 
   * @returns 모집공고 임상시험 신청
   ************************************************/
  async insertSubject(params : any) {
    let { props, member , transaction} = params
    let { memberId } = member
    let { protocolNo , organizationCd 
      , applicantTypeCd 
      , applicantNm , applicantMobileNo 
      , applicantEmail , applicantZipCode , applicantAddress , applicantAddressDetail
      , subjectRelation , subjectNm , subjectBirthDate , subjectGender 
      , prenancyYn 
      , applyTypeCd 
      , statusCd
    } = props


    const encrypt_iv = randomBytes(16).toString('hex').toUpperCase()

    let result : any = await this.CommonModel.sequelize.query(
      `
       INSERT INTO TB_SUBJECT (
              ORGANIZATION_CD
              ,PROTOCOL_NO
              ,APPLICANT_TYPE_CD
              ,APPLY_DTM
              ,MEMBER_LOGIN_ID
              ,APPLICANT_NM
              ,APPLICANT_MOBILE_NO
              ,APPLICANT_EMAIL
              ,APPLICANT_ZIP_CODE
              ,APPLICANT_ADDRESS
              ,APPLICANT_ADDRESS_DETAIL
              ,SUBJECT_RELATION
              ,SUBJECT_NM
              ,SUBJECT_BIRTH_DATE
              ,SUBJECT_GENDER
              ,PRENANCY_YN
              ,APPLY_TYPE_CD
              ,WRITE_USER_LOGIN_ID
              ,STATUS_CD
              ,CANCEL_REASON_CD
              ,CANCEL_REASON_ETC
              ,CANCELER_TYPE_CD
              ,CANCEL_USER_LOGIN_ID
              ,CANCEL_DTM
              ,REJECT_USER_LOGIN_ID
              ,REJECT_DTM
              ,SURVEY_YN
              ,SURVEY_WRITE_DTM
              ,ENCRYPT_IV
              ,CREATE_MEMBER_LOGIN_ID ,CREATE_USER_LOGIN_ID ,CREATE_DTM
              ,MODIFY_MEMBER_LOGIN_ID ,MODIFY_USER_LOGIN_ID ,MODIFY_MEMBER_DTM ,MODIFY_USER_DTM
     ) VALUES ( 
                :organizationCd
                ,:protocolNo
                ,:applicantTypeCd
                ,now()
                ,:memberId
                ,HEX(AES_ENCRYPT(:applicantNm, :aesSecretkey, :encrypt_iv))
                ,HEX(AES_ENCRYPT(:applicantMobileNo, :aesSecretkey, :encrypt_iv))
                ,HEX(AES_ENCRYPT(:applicantEmail, :aesSecretkey, :encrypt_iv))
                ,:applicantZipCode
                ,:applicantAddress
                ,:applicantAddressDetail
                ,:subjectRelation
                ,HEX(AES_ENCRYPT(:subjectNm, :aesSecretkey, :encrypt_iv))
                ,HEX(AES_ENCRYPT(:subjectBirthDate, :aesSecretkey, :encrypt_iv))
                ,:subjectGender
                ,:prenancyYn
                ,:applyTypeCd
                ,null
                ,:statusCd
                ,null
                ,null
                ,null
                ,null
                ,null
                ,null
                ,null
                ,'N'
                ,null
                ,:encrypt_iv
                ,:memberId, null , now()
                ,:memberId, null , now(), null
              )
      `,
      {
        replacements: {
          applicantTypeCd,
          applicantNm,
          applicantMobileNo,

          applicantEmail,
          applicantZipCode,
          applicantAddress,
          applicantAddressDetail,

          subjectRelation,
          subjectNm,
          subjectBirthDate,
          subjectGender,

          prenancyYn: prenancyYn ?? 'N',

          applyTypeCd,
          statusCd,

          protocolNo,
          organizationCd,
          memberId,

          aesSecretkey:this.aesSecretkey,
          encrypt_iv:encrypt_iv
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
        raw: true 
      },
    );

    return result[0];
  }

  /*************************************************
   * 신청자 상세
   * 
   * @returns  신청자 상세
   ************************************************/
  async getSubjectInfo(params : any) {
    let { props, member, transaction } = params;
    let { subjectId } = props
    // 멤버 테이블 INNER 에서 LEFT로 변경
    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT ts.ID 
                ,ts.ORGANIZATION_CD 
                ,tog.ORGANIZATION_NM 
        	      ,tog.ORGANIZATION_TYPE_CD 
                ,tpo.CONSENT_TYPE_CD 
        	      ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpo.CONSENT_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'CONSENT_TYPE') AS CONSENT_TYPE_CD_NM
                ,ts.PROTOCOL_NO 
                ,ts.APPLICANT_TYPE_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = ts.APPLICANT_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'APPLICANT_TYPE') AS APPLICANT_TYPE_CD_NM
                ,ts.APPLY_DTM 
                ,ts.MEMBER_LOGIN_ID 
                ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_NM
                ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_MOBILE_NO), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_MOBILE_NO
                ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_EMAIL), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_EMAIL
                ,ts.APPLICANT_ZIP_CODE
                ,ts.APPLICANT_ADDRESS
                ,ts.APPLICANT_ADDRESS_DETAIL
                ,CAST(AES_DECRYPT(UNHEX(tm.PHONE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_PHONE_NO
                ,CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_MOBILE_NO
                ,CAST(AES_DECRYPT(UNHEX(tm.BIRTH_DATE), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS APPLICANT_BIRTH_DATE
                ,tm.GENDER AS APPLICANT_GENDER
                ,CAST(AES_DECRYPT(UNHEX(tm.EMAIL), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_EMAIL
                ,tm.ZIP_CODE AS MEMBER_ZIP_CODE
                ,tm.ADDRESS AS MEMBER_ADDRESS
                ,tm.ADDRESS_DETAIL AS MEMBER_ADDRESS_DETAIL
                ,ts.SUBJECT_RELATION 
                ,CAST(AES_DECRYPT(UNHEX(ts.SUBJECT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS SUBJECT_NM
                ,CAST(AES_DECRYPT(UNHEX(ts.SUBJECT_BIRTH_DATE), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS SUBJECT_BIRTH_DATE
                ,ts.SUBJECT_GENDER 
                ,ts.PRENANCY_YN 
                ,ts.APPLY_TYPE_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = ts.APPLY_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'APPLY_TYPE') AS APPLY_TYPE_CD_NM
                ,ts.WRITE_USER_LOGIN_ID 
                ,ts.STATUS_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = ts.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'SUBJECT_STATUS') AS STATUS_CD_NM
                ,ts.CANCEL_REASON_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = ts.CANCEL_REASON_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'CANCEL_REASON') AS CANCEL_REASON_CD_NM
                ,ts.CANCEL_REASON_ETC 
                ,ts.CANCELER_TYPE_CD 
                ,ts.CANCEL_USER_LOGIN_ID 
                ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                    FROM TB_USER tu 
                   WHERE tu.LOGIN_ID = ts.CANCEL_USER_LOGIN_ID
                  ) AS CANCEL_USER_NM
                ,ts.CANCEL_DTM 
                ,ts.REJECT_USER_LOGIN_ID 
                ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                    FROM TB_USER tu 
                   WHERE tu.LOGIN_ID = ts.REJECT_USER_LOGIN_ID
                  ) AS REJECT_USER_NM
                ,ts.REJECT_DTM 
                ,ts.REJECT_REASON
                ,ts.SURVEY_YN 
                ,ts.SURVEY_WRITE_DTM 
                ,ts.CREATE_MEMBER_LOGIN_ID 
                ,ts.CREATE_USER_LOGIN_ID 
                ,ts.CREATE_DTM 
                ,ts.MODIFY_MEMBER_LOGIN_ID 
                ,ts.MODIFY_USER_LOGIN_ID 
                ,ts.MODIFY_MEMBER_DTM 
                ,ts.MODIFY_USER_DTM 
          FROM TB_SUBJECT ts 
         INNER JOIN TB_ORGANIZATION tog ON ts.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
         LEFT JOIN TB_MEMBER tm ON tm.LOGIN_ID = ts.MEMBER_LOGIN_ID
         INNER JOIN TB_PROJECT_ORGANIZATION tpo ON tpo.ORGANIZATION_CD = ts.ORGANIZATION_CD AND tpo.PROTOCOL_NO = ts.PROTOCOL_NO 
          WHERE 1=1
            AND ts.ID = :id
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

    return result[0];
  }


  /*************************************************
   * 신청자 수정
   * 
   * @param 
   * @returns 신청자 수정
   ************************************************/
  async updateSubjectStatusInfo(params: any) {
    let { props , member , transaction } = params;
    let { memberId } = member
    let { subjectId, statusCd 
      , cancelReasonCd ,cancelReasonEtc ,cancelerTypeCd , cancelDtm 
    } = props

    let result : any = await this.CommonModel.sequelize.query(
      `
      UPDATE TB_SUBJECT SET
             STATUS_CD = :statusCd
            ,CANCEL_REASON_CD = :cancelReasonCd
            ,CANCEL_REASON_ETC = :cancelReasonEtc
            ,CANCELER_TYPE_CD = :cancelerTypeCd
            ,CANCEL_DTM = :cancelDtm
            ,MODIFY_MEMBER_DTM  = now()
            ,MODIFY_MEMBER_LOGIN_ID = :memberId
      WHERE 1=1
        AND ID = :subjectId
      `,
      {
        replacements: {
          statusCd: statusCd,
          cancelReasonCd:cancelReasonCd ?? null,
          cancelReasonEtc:cancelReasonEtc ?? null,
          cancelerTypeCd:cancelerTypeCd ?? null,
          cancelDtm:cancelDtm ?? null,
          memberId: memberId,
          subjectId:subjectId
        },
        type: QueryTypes.UPDATE, transaction,
      },
    );

    return result[0];
  }

  /*************************************************
   * 신청자 설문완료 업데이트
   * 
   * @param 
   * @returns 신청자 수정
   ************************************************/
  async updateSubjectSurveyYn(params: any) {
    let { props , member , transaction } = params;
    let { memberId } = member
    let { subjectId, surveyYn} = props

    let result : any = await this.CommonModel.sequelize.query(
      `
      UPDATE TB_SUBJECT SET
             SURVEY_YN  = :surveyYn
            ,SURVEY_WRITE_DTM = now()
            ,MODIFY_MEMBER_DTM  = now()
            ,MODIFY_MEMBER_LOGIN_ID = :memberId
      WHERE 1=1
        AND ID = :subjectId
      `,
      {
        replacements: {
          surveyYn: surveyYn,
          memberId: memberId,
          subjectId:subjectId
        },
        type: QueryTypes.UPDATE, transaction,
      },
    );

    return result[0];
  }

}
