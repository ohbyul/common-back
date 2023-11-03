import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import moment from 'moment';
@Injectable()
export class ConsentQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 신청자 서명 리스트 조회 by subjectId
   * 
   * @param 
   * @returns 
   ************************************************/
  async getConsentSignListBySubjectId(params: any) {
    let { props , transaction } = params;
    let { subjectId, organizationCd , protocolNo } = props

    const result: any = await this.CommonModel.sequelize.query(
      `
        SELECT tpcf.ID
              ,tpcf.ORGANIZATION_CD 
              ,tog.ORGANIZATION_NM
              ,tpcf.PROTOCOL_NO 
              ,tpcf.FORM_TYPE_CD
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpcf.FORM_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'FORM_TYPE') AS FORM_TYPE_CD_NM
              ,tpcf.VERSION 
              ,tpcf.ORIGINAL_FILE_NM AS CONSENT_FORM_ORIGINAL_FILE_NM
              ,tpcf.SAVE_FILE_NM AS CONSENT_FORM_SAVE_FILE_NM
              ,tpcf.FILE_PATH AS CONSENT_FORM_FILE_PATH
              ,tpcs.SUBJECT_ID
              ,ts.MEMBER_LOGIN_ID AS APPLICANT_LOGIN_ID
              ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS APPLICANT_MEMBER_NM
              ,CAST(AES_DECRYPT(UNHEX(ts.APPLICANT_NM), :aesSecretkey, ts.ENCRYPT_IV) AS CHAR) AS APPLICANT_NM
              ,tpcs.ID AS CONSENT_SIGN_ID
              ,tpcs.APPLICANT_SIGN_DTM
              ,tpcs.RESEARCHER_LOGIN_ID
              ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                  FROM TB_USER tu 
                 WHERE tu.LOGIN_ID = tpcs.RESEARCHER_LOGIN_ID 
               ) AS RESEARCHER_USER_NM
              ,tpcs.RESEARCHER_SIGN_DTM
              ,tpcs.MANAGER_LOGIN_ID
              ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                  FROM TB_USER tu 
                 WHERE tu.LOGIN_ID = tpcs.MANAGER_LOGIN_ID 
               ) AS MANAGER_USER_NM
              ,tpcs.MANAGER_SIGN_DTM
              ,tpcs.CONSENT_TYPE_CD
              ,tpo.CONSENT_TYPE_CD AS ORGANIZATION_CONSENT_TYPE_CD
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpcs.CONSENT_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'CONSENT_TYPE') AS CONSENT_TYPE_CD_NM
              ,tpcs.FILE_NM AS CONSENT_SIGN_ORIGINAL_FILE_NM
              ,tpcs.FILE_PATH AS CONSENT_SIGN_FILE_PATH
              ,tpcs.STATUS_CD
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpcs.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'CONSENT_STATUS') AS STATUS_CD_NM
              ,tpcs.CREATE_DTM
         FROM TB_PROJECT_CONSENT_FORM tpcf 
         INNER JOIN TB_PROJECT_ORGANIZATION tpo ON tpo.PROTOCOL_NO = tpcf.PROTOCOL_NO 
                                               AND tpo.ORGANIZATION_CD = tpcf.ORGANIZATION_CD
         INNER JOIN TB_ORGANIZATION tog ON tpcf.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
         LEFT JOIN TB_PROJECT_CONSENT_SIGN tpcs ON tpcf.PROTOCOL_NO = tpcs.PROTOCOL_NO 
                                                AND tpcf.ORGANIZATION_CD = tpcs.ORGANIZATION_CD 
                                                AND tpcf.VERSION = tpcs.VERSION 
                                                AND tpcf.FORM_TYPE_CD = tpcs.FORM_TYPE_CD 
                                                AND tpcs.SUBJECT_ID = :subjectId
         LEFT JOIN TB_SUBJECT ts ON ts.ID = tpcs.SUBJECT_ID
         LEFT JOIN TB_MEMBER tm ON tm.LOGIN_ID = ts.MEMBER_LOGIN_ID
        WHERE 1=1
          AND tpcf.DELETE_YN = 'N'
          AND tpcf.ORGANIZATION_CD = :organizationCd
          AND tpcf.PROTOCOL_NO = :protocolNo
        ORDER BY tpcf.ID DESC
      `,  
      { 
        replacements: {
          organizationCd,
          protocolNo,
          subjectId,

          aesSecretkey:this.aesSecretkey,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }

  /*************************************************
   * 서명동의서 다운로드시, 이력 생성
   * 
   * @returns  서명동의서 다운로드시, 이력 생성
   ************************************************/
  async insertConsentDownloadHistory(params : any) {
    let { props, member , transaction} = params
    let { memberId } = member
    let { consentSignId , downloadTypeCd 
    } = props

    let result : any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_PROJECT_CONSENT_DOWNLOAD_HIST ( 
             PROJECT_CONSENT_SIGN_ID 
            ,DOWNLOAD_TYPE_CD 
            ,DOWNLOAD_DTM
            ,DOWNLOAD_USER_LOGIN_ID
            ,DOWNLOAD_MEMBER_LOGIN_ID
            ,CREATE_MEMBER_LOGIN_ID ,CREATE_DTM  
            ,MODIFY_MEMBER_LOGIN_ID , MODIFY_USER_LOGIN_ID , MODIFY_MEMBER_DTM , MODIFY_USER_DTM 
      )VALUES( :consentSignId  
            ,:downloadTypeCd
            ,now()
            ,null
            ,:memberId
            ,:memberId , now()
            ,:memberId ,null ,now() , null 
          )
      `,
      {
        replacements: {
          consentSignId: consentSignId,
          downloadTypeCd: downloadTypeCd,
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
   * 동의서 파일 조회 by 프로토콜 + 조직Cd
   * 
   * @param 
   * @returns 
   ************************************************/
  async getProjectConsentList(params: any) {
    let { org , props , user , transaction } = params;
    let { protocolNoOrigin } = props
    let { ORGANIZATION_CD } = org
    const result: any = await this.CommonModel.sequelize.query(
      `
        SELECT tpcf.ID
              ,tpcf.ORGANIZATION_CD 
              ,tog.ORGANIZATION_NM
              ,tpcf.PROTOCOL_NO 
              ,tpcf.FORM_TYPE_CD
              ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpcf.FORM_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'FORM_TYPE') AS FORM_TYPE_CD_NM
              ,tpcf.VERSION 
              ,tpcf.ORIGINAL_FILE_NM 
              ,tpcf.SAVE_FILE_NM 
              ,tpcf.FILE_PATH 
              ,tpcf.WRITE_LOGIN_ID 
              ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                  FROM TB_USER tu 
                 WHERE tu.LOGIN_ID = tpcf.WRITE_LOGIN_ID
               ) AS WRITE_USER_NM
              ,tpcf.WRITE_DTM 
              ,tpcf.DELETE_YN 
              ,(SELECT IF(COUNT(tpcs.ID) > 0 , 'Y' , 'N') 
                  FROM TB_PROJECT_CONSENT_SIGN tpcs 
                  WHERE tpcs.ORGANIZATION_CD = tpcf.ORGANIZATION_CD 
                    AND tpcs.PROTOCOL_NO = tpcf.PROTOCOL_NO 
                    AND tpcs.FORM_TYPE_CD = tpcf.FORM_TYPE_CD
                    AND tpcs.VERSION = tpcf.VERSION 
                    AND tpcs.CONSENT_TYPE_CD = 'DIGITAL' 
               ) AS DIGITAL_CONSENT_SIGNED_YN 
               ,(SELECT IF(COUNT(tpcs.ID) > 0 , 'Y' , 'N') 
                  FROM TB_PROJECT_CONSENT_SIGN tpcs 
                  WHERE tpcs.ORGANIZATION_CD = tpcf.ORGANIZATION_CD 
                    AND tpcs.PROTOCOL_NO = tpcf.PROTOCOL_NO 
                    AND tpcs.FORM_TYPE_CD = tpcf.FORM_TYPE_CD
                    AND tpcs.VERSION = tpcf.VERSION 
               ) AS SIGNED_YN 
               ,(SELECT IF(COUNT(tpcc.ID) > 0 , 'Y' , 'N')
                   FROM TB_PROJECT_CONSENT_COORDINATE tpcc 
                  WHERE tpcc.PROTOCOL_NO = tpcf.PROTOCOL_NO
                    AND tpcc.ORGANIZATION_CD  = tpcf.ORGANIZATION_CD
                    AND tpcc.FORM_TYPE_CD = tpcf.FORM_TYPE_CD
                    AND tpcc.VERSION = tpcf.VERSION
               ) AS COORDINATE_YN
         FROM TB_PROJECT_CONSENT_FORM tpcf 
        INNER JOIN TB_ORGANIZATION tog ON tpcf.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
        WHERE 1=1
          AND tpcf.DELETE_YN = 'N'
          AND tpcf.ORGANIZATION_CD = :organizationCd
          AND tpcf.PROTOCOL_NO = :protocolNoOrigin
        ORDER BY tpcf.FORM_TYPE_CD DESC, tpcf.WRITE_DTM ASC
      `,  
      { 
        replacements: {
          organizationCd:ORGANIZATION_CD,
          protocolNoOrigin,

          aesSecretkey:this.aesSecretkey,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }
}
