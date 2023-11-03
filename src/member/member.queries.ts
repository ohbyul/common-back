import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import moment from 'moment';
import { randomBytes } from 'crypto';

@Injectable()
export class MemberQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 로그인시,  멤버 마지막 로그인 시간 업데이트
   * 
   * @param 
   * @returns 
   ************************************************/
  async updateMemberLastLogin(params: any) {
    let { props, transaction } = params;
    let { memberId } = props
    let updateMemberLoingQuery: any = await this.CommonModel.sequelize.query(
        `
          UPDATE TB_MEMBER tm 
            SET tm.LAST_LOGIN_DTM = now()
              , tm.PWD_ERROR_COUNT = 0
              , tm.MODIFY_DTM = now()
              , tm.MODIFY_LOGIN_ID = :memberId
          WHERE 1=1
          AND tm.LOGIN_ID = :memberId
        `,
        {
          replacements: {
            memberId:memberId,
          },
          type: QueryTypes.UPDATE, transaction
        },
      );

    return updateMemberLoingQuery[0];
  }

  /*************************************************
   * 비밀번호 에러 카운트 
   * -> 비밀번호 변경, 로그인
   * 
   * @param {String} memberId 
   * @returns 
   ************************************************/
  async pwdErrorUpdate(params: any) {
    let { props, transaction } = params;
    let pwdErrorUpdateQuery: any = await this.CommonModel.sequelize.query(
        `
          UPDATE TB_MEMBER tm 
          SET tm.PWD_ERROR_COUNT = tm.PWD_ERROR_COUNT + 1
          WHERE 1=1
          AND tm.LOGIN_ID = :memberId
        `,
        {
          replacements: {
            memberId:props.memberId,
          },
          type: QueryTypes.UPDATE, transaction
        },
      )

    return pwdErrorUpdateQuery[0];
  }
  /*************************************************
   * 로그인아이디로 멤버 조회
   * 
   * @returns 로그인아이디로 멤버 조회
   ************************************************/
  async getMemberByLoginId(params : any) {
    let { props , transaction } = params
    let { loginId } = props

    const result: any = await this.CommonModel.sequelize.query(
        `
        SELECT tm.ID 
              ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
              ,tm.LOGIN_ID 
              ,tm.LOGIN_PWD
              ,CAST(AES_DECRYPT(UNHEX(tm.BIRTH_DATE), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS BIRTH_DATE
              ,tm.GENDER 
              ,CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_MOBILE_NO
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
   * 공개포탈 멤버 가입   
   * 
   * @param SignUpDto
   * @returns 공개포탈 멤버 가입 
   ************************************************/
  async insertMember(params: any) {
    let { transaction, props } = params;
    let { memberId, memberPwd, hashPassword
      , memberNm , birth , gender , mobileNo , zipCode , address , addressDetail  
      // 공개포탈에서 가입시, 추가 데이터
      , phoneNo , email , keywordList 
    } = props;    
    
    const pwdErrorCount = 0
    const statusCd = 'JOIN'    // 상태(가입 : JOIN, 탈퇴 : DELETE) GROUP_CD : MEMBER_STATUS
    const encrypt_iv = randomBytes(16).toString('hex').toUpperCase()

    let insertMember: any =
      await this.CommonModel.sequelize.query(
        `
         INSERT INTO TB_MEMBER (
                MEMBER_NM 
                ,LOGIN_ID 
                ,LOGIN_PWD
                ,BIRTH_DATE 
                ,GENDER 
                ,MOBILE_NO 
                ,PHONE_NO 
                ,EMAIL 
                ,ZIP_CODE 
                ,ADDRESS 
                ,ADDRESS_DETAIL 
                ,KEYWORD_LIST 
                ,LAST_LOGIN_DTM 
                ,JOIN_DTM 
                ,PWD_ERROR_COUNT 
                ,LAST_PWD_CHANGE_DATE 
                ,PRE_LOGIN_PWD 
                ,STATUS_CD 
                ,DELETE_DTM 
                ,DELETE_REASON_CD 
                ,DELETE_REASON_ETC
                ,ENCRYPT_IV
                ,CREATE_DTM ,CREATE_LOGIN_ID ,MODIFY_DTM ,MODIFY_LOGIN_ID 
              ) VALUES ( 
                     HEX(AES_ENCRYPT(:memberNm, :aesSecretkey, :encrypt_iv))
                    ,:memberId 
                    ,:hashPassword
                    ,HEX(AES_ENCRYPT(:birth, :aesSecretkey, :encrypt_iv))
                    ,:gender 
                    ,HEX(AES_ENCRYPT(:mobileNo, :aesSecretkey, :encrypt_iv))
                    ,HEX(AES_ENCRYPT(:phoneNo, :aesSecretkey, :encrypt_iv))
                    ,HEX(AES_ENCRYPT(:email, :aesSecretkey, :encrypt_iv))
                    ,:zipCode 
                    ,:address 
                    ,:addressDetail 
                    ,:keywordList 
                    ,null 
                    ,now() 
                    ,:pwdErrorCount 
                    ,now() 
                    ,null 
                    ,:statusCd 
                    ,null 
                    ,null 
                    ,null
                    ,:encrypt_iv
                    ,now() , :memberId , now() , :memberId
          ) 
        `,
        {
          replacements: {
            memberId , 
            memberPwd , 
            hashPassword,
            memberNm , 
            birth , 
            gender , 
            mobileNo,
            zipCode , 
            address , 
            addressDetail ,

            phoneNo : phoneNo === undefined ? null : phoneNo , 
            email : email === undefined ? null : email, 
            keywordList: keywordList.length > 0 ? JSON.stringify(keywordList) : null ,
            pwdErrorCount:pwdErrorCount,
            statusCd:statusCd,

            aesSecretkey:this.aesSecretkey,
            encrypt_iv:encrypt_iv
          },
          type: QueryTypes.INSERT , transaction 
        },
      );

    return insertMember[0];
  }
  /*************************************************
   * 공개포탈 약관동의 History 
   * 
   * @param 
   * @returns 공개포탈 약관 동의 History
   ************************************************/
  async insertTermsAgree(params: any) {
    let { transaction, props , termsAgree} = params;
    let { memberId } = props;
    let { termsKindCd, termsTypeCd} = termsAgree

    const termAgree: any = await this.CommonModel.sequelize.query(
      `
        INSERT INTO TB_TERMS_AGREEMENT(
               TERMS_TYPE_CD
              ,TERMS_KIND_CD
              ,START_DATE
              ,MEMBER_LOGIN_ID
              ,AGREEMENT_DTM
              ,CREATE_LOGIN_ID
              ,CREATE_DTM
              ,MODIFY_LOGIN_ID
              ,MODIFY_DTM
             ) VALUE(
               :termsTypeCd
              ,:termsKindCd
              ,now()
              ,:memberId
              ,now()
              ,:memberId
              ,now()
              ,:memberId
              ,now()
             )
      `,
      {
        replacements : {
          termsKindCd,
          termsTypeCd,
          memberId
        },
        type: QueryTypes.INSERT , transaction
      },
    );
  }

  /*************************************************
   * 사용자 암호 변경  
   * -> 비밀번호 리셋 / 비밀번호 변경
   * 
   * @param {String} memberId         아이디
   * @param {String} dbPw             이전 비밀번호
   * @param {String} nowPasswordCheck 변경 비밀번호
   * @param {String} modifyMemberId     
   * @returns 
   ************************************************/
  async updateMemberPwd(params: any) {
    let {memberId , dbPw , nowPasswordCheck , modifyMemberId , transaction} = params
    let updateData: any = await this.CommonModel.sequelize.query(
      ` 
      UPDATE TB_MEMBER
        SET LOGIN_PWD = :nowPasswordCheck
          , PRE_LOGIN_PWD = :dbPw
          , LAST_PWD_CHANGE_DATE = now()
          , PWD_ERROR_COUNT = 0
          , MODIFY_DTM = now()
          , MODIFY_LOGIN_ID = :modifyMemberId
        WHERE 1=1
        AND LOGIN_ID = :memberId
      `,
      {
        replacements: {
          memberId:memberId,
          dbPw:dbPw,
          modifyMemberId:modifyMemberId,
          nowPasswordCheck:nowPasswordCheck,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }

  /*************************************************
   * 공개포탈 - 회원 관리 (수정)
   * 
   * @param 
   * @returns 공개포탈 - 회원 관리
   ************************************************/
  async updateMemberInfo(params: any) {
    let { props , member , transaction} = params
    let { memberId , memberNm , birth , gender , mobileNo , phoneNo ,
      email , zipCode , address , addressDetail , keywordList
    } = props
    const modifyMemberId = member.memberId
    let updateData: any = await this.CommonModel.sequelize.query(
      ` 
        UPDATE TB_MEMBER
          SET MEMBER_NM = HEX(AES_ENCRYPT(:memberNm, :aesSecretkey, ENCRYPT_IV))
              ,BIRTH_DATE = HEX(AES_ENCRYPT(:birth, :aesSecretkey, ENCRYPT_IV))
              ,GENDER = :gender
              ,EMAIL = HEX(AES_ENCRYPT(:email, :aesSecretkey, ENCRYPT_IV))
              ,MOBILE_NO = HEX(AES_ENCRYPT(:mobileNo, :aesSecretkey, ENCRYPT_IV))
              ,PHONE_NO = HEX(AES_ENCRYPT(:phoneNo, :aesSecretkey, ENCRYPT_IV))
              ,ADDRESS = :address
              ,ADDRESS_DETAIL = :addressDetail
              ,ZIP_CODE = :zipCode
              ,KEYWORD_LIST = :keywordList
              ,MODIFY_DTM = now()
              ,MODIFY_LOGIN_ID = :modifyMemberId
        WHERE 1=1
          AND LOGIN_ID = :memberId
      `,
      {
        replacements: {
          memberId,
          memberNm,
          mobileNo,
          birth,
          gender,
          zipCode,
          address,
          addressDetail,
          phoneNo : phoneNo === undefined ? null : phoneNo , 
          email : email === undefined ? null : email, 
          keywordList: keywordList.length > 0 ? JSON.stringify(keywordList) : null ,
          modifyMemberId:modifyMemberId,

          aesSecretkey:this.aesSecretkey,
        },
        type: QueryTypes.UPDATE , transaction
      },
    );

    return updateData;
  }


  /*************************************************
   * 공개포탈 - 회원 탈퇴 전 임상진행중 프로젝트 여부
   * 
   * @param 
   * @returns 공개포탈 - 탈퇴 전 임상진행중 프로젝트 여부
   ************************************************/
  async clinicalYn(params: any) {
    let { props , member , transaction} = params
    let {memberId} = member
    let clinicalYnData: any = await this.CommonModel.sequelize.query(
      `
        SELECT COUNT(*) AS CLINICALCOUNT
          FROM TB_SUBJECT ts 
         INNER JOIN TB_PROJECT_ORGANIZATION tpo 
            ON ts.ORGANIZATION_CD = tpo.ORGANIZATION_CD 
           AND ts.PROTOCOL_NO = tpo.PROTOCOL_NO 
           AND tpo.DELETE_YN = 'N'
         INNER JOIN TB_PROJECT tp 
            ON ts.PROTOCOL_NO = tp.PROTOCOL_NO 
           AND tp.DELETE_YN = 'N'
           AND tp.STATUS_CD = 'COMPLETE'
           AND tp.TRIAL_CLOSE_YN = 'N'
           AND DATE_FORMAT(NOW(), '%Y-%m-%d') BETWEEN  tp.TRIAL_START_DATE AND TRIAL_END_DATE
         WHERE 1=1
           AND ts.MEMBER_LOGIN_ID = :memberId
           AND ts.STATUS_CD IN ('APPLY','RESERVATION')
      `,
      { 
        replacements: {
          memberId:memberId,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
  );
  return clinicalYnData[0].CLINICALCOUNT

  }
   /*************************************************
   * 관리포탈 - 회원 탈퇴 
   * 
   * @param 
   * @returns 관리포탈 - 회원 탈퇴
   ************************************************/
   async deleteMember(params: any) {
    let { props , member , transaction } = params
    let {memberId} = member
    let { deleteReasonCd , deleteReasonEtc } = props
    let deleteData :any = await this.CommonModel.sequelize.query(
      `
        UPDATE TB_MEMBER
           SET STATUS_CD = 'DELETE'
              ,DELETE_DTM = now()
              ,DELETE_REASON_CD = :deleteReasonCd
              ,DELETE_REASON_ETC = :deleteReasonEtc
         WHERE 1=1
           AND LOGIN_ID = :memberId
      `,
      {
        replacements: {
          memberId: memberId,
          deleteReasonCd: deleteReasonCd,
          deleteReasonEtc: deleteReasonEtc || null
        },
        type: QueryTypes.UPDATE , transaction
      },

    );

    return deleteData
  }
  /*************************************************
     * 비밀번호 변경 권고 날짜 변경  
     * -> 비밀번호 변경 권고일 변경
     * 
     * @param {String} memberId           사용자 아이디
     * @param {String} pwdResetYn       비밀번호 리셋 여부    
     * @returns 
     ************************************************/
  async updateLastPwChgDate(params: any) {
    let {memberId , transaction} = params
    let updatePwdData : any = await this.CommonModel.sequelize.query(
      `
      UPDATE  TB_MEMBER
        SET  LAST_PWD_CHANGE_DATE = now()
            ,MODIFY_LOGIN_ID = :memberId
            ,MODIFY_DTM = now()
        WHERE  1=1
          AND  LOGIN_ID = :memberId
      `
      ,
      {
        replacements: {
          memberId:memberId,
        },
        type: QueryTypes.UPDATE , transaction 
      },
    );
    return updatePwdData;
  }
}
