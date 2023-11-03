import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class AuthQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON,
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];
  
  /*************************************************
   * 사용자 정보 조회   
   * 
   * @param {String} memberId  사용자 아이디
   * @returns 사용자 정보
   ************************************************/
  async memberInfo(params: any) {
    let { transaction, props } = params;
    let { memberId } = props;
    const memberInfo: any = await this.CommonModel.sequelize.query(
        `
        SELECT tm.ID 
              ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
              ,tm.LOGIN_ID 
              ,tm.LOGIN_PWD 
              ,CAST(AES_DECRYPT(UNHEX(tm.BIRTH_DATE), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS BIRTH_DATE
              ,tm.GENDER 
              ,CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MOBILE_NO
              ,CAST(AES_DECRYPT(UNHEX(tm.PHONE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS PHONE_NO
              ,CAST(AES_DECRYPT(UNHEX(tm.EMAIL), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS EMAIL
              ,tm.ZIP_CODE 
              ,tm.ADDRESS 
              ,tm.ADDRESS_DETAIL 
              ,tm.EMAIL_RECEIVE_YN 
              ,tm.SMS_RECEIVE_YN 
              ,tm.KEYWORD_LIST 
              ,tm.LAST_LOGIN_DTM 
              ,tm.JOIN_DTM 
              ,tm.PWD_ERROR_COUNT 
              ,tm.LAST_PWD_CHANGE_DATE 
              ,tm.PRE_LOGIN_PWD 
              ,tm.STATUS_CD 
              ,tm.USE_RESTRICTION_YN
              ,tm.LOGIN_RESTRICTION_YN
              ,tm.DELETE_DTM 
              ,tm.DELETE_REASON_CD 
              ,tm.DELETE_REASON_ETC 
              ,TIMESTAMPDIFF(MONTH, tm.LAST_PWD_CHANGE_DATE, now()) AS PWD_MONTH_DIFF
         FROM TB_MEMBER tm 
        WHERE 1=1
          AND tm.LOGIN_ID = :memberId
        `,
        { 
          replacements: {
            memberId,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return memberInfo[0];
  }
  /*************************************************
   * 로그인아이디로 멤버 조회
   * 
   * @returns 로그인아이디로 멤버 조회
   ************************************************/
  async getMemberByLoginId(params : any) {
    let { props , user , transaction } = params
    let { loginId } = props

    const result: any = await this.CommonModel.sequelize.query(
        `
        SELECT tm.ID 
              ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
              ,tm.LOGIN_ID 
              ,tm.LOGIN_PWD
              ,CAST(AES_DECRYPT(UNHEX(tm.BIRTH_DATE), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS BIRTH_DATE
              ,tm.GENDER 
              ,CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MOBILE_NO
              ,CAST(AES_DECRYPT(UNHEX(tm.PHONE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS PHONE_NO
              ,CAST(AES_DECRYPT(UNHEX(tm.EMAIL), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS EMAIL
              ,tm.ZIP_CODE 
              ,tm.ADDRESS 
              ,tm.ADDRESS_DETAIL 
              ,tm.EMAIL_RECEIVE_YN 
              ,tm.SMS_RECEIVE_YN 
              ,tm.KEYWORD_LIST 
              ,tm.LAST_LOGIN_DTM 
              ,tm.JOIN_DTM 
              ,tm.PWD_ERROR_COUNT 
              ,tm.LAST_PWD_CHANGE_DATE 
              ,tm.PRE_LOGIN_PWD 
              ,tm.STATUS_CD 
              ,tm.USE_RESTRICTION_YN
              ,tm.LOGIN_RESTRICTION_YN
              ,tm.DELETE_DTM 
              ,tm.DELETE_REASON_CD 
              ,tm.DELETE_REASON_ETC 
         FROM TB_MEMBER tm
        WHERE 1=1
          AND tm.LOGIN_ID = :loginId
        `,  
        { 
          replacements: {
            loginId,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result[0];
  }

  /*************************************************
   * 사용자 정보 조회 by 사용자 휴대폰 번호
   * 
   * @param {String} mobileNo  사용자 휴대폰 번호
   * @returns 사용자 정보
   ************************************************/
  async memberInfoByMobileNo(params: any) {
    let { transaction, props } = params;
    let { mobileNo } = props;
    const memberInfo: any = await this.CommonModel.sequelize.query(
        `
        SELECT tm.ID 
              ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
              ,tm.LOGIN_ID 
              ,tm.LOGIN_PWD 
              ,CAST(AES_DECRYPT(UNHEX(tm.BIRTH_DATE), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS BIRTH_DATE
              ,tm.GENDER 
              ,CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MOBILE_NO
              ,CAST(AES_DECRYPT(UNHEX(tm.PHONE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS PHONE_NO
              ,CAST(AES_DECRYPT(UNHEX(tm.EMAIL), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS EMAIL
              ,tm.ZIP_CODE 
              ,tm.ADDRESS 
              ,tm.ADDRESS_DETAIL 
              ,tm.EMAIL_RECEIVE_YN 
              ,tm.SMS_RECEIVE_YN 
              ,tm.KEYWORD_LIST 
              ,tm.LAST_LOGIN_DTM 
              ,tm.JOIN_DTM 
              ,tm.PWD_ERROR_COUNT 
              ,tm.LAST_PWD_CHANGE_DATE 
              ,tm.PRE_LOGIN_PWD 
              ,tm.STATUS_CD 
              ,tm.USE_RESTRICTION_YN
              ,tm.LOGIN_RESTRICTION_YN
              ,tm.DELETE_DTM 
              ,tm.DELETE_REASON_CD 
              ,tm.DELETE_REASON_ETC 
              ,TIMESTAMPDIFF(MONTH, tm.LAST_PWD_CHANGE_DATE, now()) AS PWD_MONTH_DIFF
         FROM TB_MEMBER tm 
        WHERE 1=1
          AND CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) = :mobileNo
        `,
        { 
          replacements: {
            mobileNo,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return memberInfo[0];
  }

  /*************************************************
   * 인증번호 저장
   * 
   * @param {String} certifyKey  휴대폰번호 또는 이메일주소
   * @param {String} certifyCd  인증번호
   * @returns null
   ************************************************/
  async insertCertifyCd(params: any) {
    let { transaction, props } = params;
    let { certifyKey,  certifyCd, certifyType} = props;
    await this.CommonModel.sequelize.query(
        `
        INSERT INTO TB_CERTIFY_CD
        (      CERTIFY_KEY
              ,CERTIFY_CD
              ,CREATE_DTM
              ,CERTIFY_YN
              ,CERTIFY_TYPE
        )
        VALUES
        (      :certifyKey
              ,:certifyCd
              ,CURRENT_TIMESTAMP
              ,'N'
              ,:certifyType
        )
            ON DUPLICATE KEY UPDATE
               CERTIFY_CD = :certifyCd
              ,CREATE_DTM = CURRENT_TIMESTAMP
              ,CERTIFY_YN = 'N'
        `,
        { 
          replacements: {
            certifyKey:certifyKey,
            certifyCd:certifyCd,
            certifyType:certifyType,
          },
          type: QueryTypes.INSERT, transaction ,
          mapToModel: true,
        },
      );

  }

  /*************************************************
   * 인증번호 조회
   * 
   * @param {String} certifyKey  휴대폰번호 또는 이메일주소
   * @param {String} certifyCd  인증번호
   * @returns 사용자 정보
   ************************************************/
  async getCertifyCd(params: any) {
    let { transaction, props } = params;
    let { certifyKey,  certifyCd} = props;
    const certifyInfo: any = await this.CommonModel.sequelize.query(
        `
        SELECT 
               CERTIFY_KEY
              ,CERTIFY_CD
              ,CREATE_DTM
              ,CERTIFY_YN
          FROM TB_CERTIFY_CD
         WHERE CERTIFY_KEY = :certifyKey
           AND CERTIFY_CD = :certifyCd
        `,
        { 
          replacements: {
            certifyKey:certifyKey,
            certifyCd:certifyCd,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return certifyInfo[0];
  }
}
