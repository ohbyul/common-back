import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class ScreeningQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];

  /*************************************************
   * 스크리닝 등록
   * 
   * @returns  스크리닝 등록
   ************************************************/
  async insertScreening(params : any) {
    let { props, member , transaction} = params
    let { memberId } = member
    let { subjectId 
      , screeningDate , screeningTime
      , organizationCd , statusCd , protocolNo
    } = props


    let result : any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_SUBJECT_SCREENING ( 
            SUBJECT_ID 
            ,ORGANIZATION_CD
            ,PROTOCOL_NO
            ,SCREENING_DATE 
            ,SCREENING_TIME 
            ,STATUS_CD
            ,CREATE_DTM , CREATE_MEMBER_LOGIN_ID
      )VALUES( :subjectId  
            ,:organizationCd
            ,:protocolNo
            ,:screeningDate
            ,:screeningTime
            ,:statusCd
            ,now() , :memberId
          )
      `,
      {
        replacements: {
          subjectId: subjectId,
          protocolNo:protocolNo,
          organizationCd:organizationCd,
          screeningDate: screeningDate,
          screeningTime: screeningTime,
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
   * 스크리닝 예약 정보 수정
   * 
   * @param createProjectDto
   * @returns 스크리닝 예약 정보 수정 성공여부
   ************************************************/
  async updateScreening(params: any) {
    let { props , member , transaction } = params;
    let { memberId } = member
    let { subjectId, screeningDate , screeningTime , statusCd
    , organizationCd
    } = props

    let result : any = await this.CommonModel.sequelize.query(
      `
      UPDATE TB_SUBJECT_SCREENING 
         SET SCREENING_DATE = :screeningDate
            ,SCREENING_TIME = :screeningTime
            ,ORGANIZATION_CD=:organizationCd
            ,STATUS_CD = :statusCd
            ,MODIFY_MEMBER_DTM  = now()
            ,MODIFY_MEMBER_LOGIN_ID = :memberId
      WHERE 1=1
        AND SUBJECT_ID = :subjectId
      `,
      {
        replacements: {
          screeningDate: screeningDate,
          screeningTime: screeningTime,
          statusCd: statusCd,
          memberId: memberId,
          subjectId:subjectId,
          organizationCd:organizationCd
        },
        type: QueryTypes.UPDATE, transaction,
      },
    );

    return result[0];
  }
  /*************************************************
   * 스크리닝 이력 등록
   * 
   * @returns  스크리닝 이력 등록
   ************************************************/
  async insertScreeningHistory(params : any) {
    let { props, member , transaction} = params
    let { memberId } = member
    let { subjectId , organizationCd
      , requestTypeCd
      , screeningDate , screeningTime
      , statusCd 
    } = props


    let result : any = await this.CommonModel.sequelize.query(
      `
       INSERT INTO TB_SUBJECT_SCREENING_HIST ( 
              SUBJECT_ID
              ,ORGANIZATION_CD
              ,REQUEST_TYPE_CD
              ,CHANGE_DTM
              ,CHANGE_USER_LOGIN_ID
              ,CHANGE_MEMBER_LOGIN_ID
              ,SCREENING_DATE
              ,SCREENING_TIME
              ,STATUS_CD
              ,CREATE_MEMBER_LOGIN_ID ,CREATE_USER_LOGIN_ID
              ,CREATE_DTM
              ,MODIFY_MEMBER_LOGIN_ID ,MODIFY_USER_LOGIN_ID
              ,MODIFY_MEMBER_DTM ,MODIFY_USER_DTM
      )VALUES( :subjectId
              ,:organizationCd
              ,:requestTypeCd
              ,now()
              ,null
              ,:memberId
              ,:screeningDate
              ,:screeningTime
              ,:statusCd
              ,:memberId ,null 
              ,now()
              ,:memberId ,null
              ,now() ,null
             )
      `,
      {
        replacements: {
          subjectId: subjectId,
          organizationCd:organizationCd,
          requestTypeCd:requestTypeCd,
          screeningDate: screeningDate,
          screeningTime: screeningTime,
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
   * 신청자 스크리닝 정보 조회
   * 
   * @returns  신청자 스크리닝
   ************************************************/
  async getSubjectScreening(params : any) {
    let { props, transaction } = params;
    let { subjectId } = props
    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tss.ID 
                ,tss.ORGANIZATION_CD
                ,tog.ORGANIZATION_NM
                ,tss.PROTOCOL_NO 
                ,tss.SUBJECT_ID 
                ,tss.SCREENING_DATE 
                ,tss.SCREENING_TIME 
                ,tss.STATUS_CD 
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tss.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'SCREENING_STATUS') AS STATUS_CD_NM
                ,tss.CREATE_MEMBER_LOGIN_ID 
                ,tss.CREATE_USER_LOGIN_ID 
                ,tss.CREATE_DTM 
                ,tss.MODIFY_MEMBER_LOGIN_ID 
                ,tss.MODIFY_USER_LOGIN_ID 
                ,tss.MODIFY_MEMBER_DTM 
                ,tss.MODIFY_USER_DTM 
           FROM TB_SUBJECT_SCREENING tss 
          INNER JOIN TB_ORGANIZATION tog ON tss.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
          WHERE 1=1
            AND tss.SUBJECT_ID = :id
        `,  
        { 
          replacements : {
            id:subjectId,
          },
          type: QueryTypes.SELECT, transaction,
          mapToModel: true,
        },
      );

    return result[0];
  }

  /*************************************************
   * 신청자 스크리닝 이력 조회
   * 
   * @returns 신청자 스크리닝 이력 조회
   ************************************************/
  async getScreeningHistory(params : any) {
    let { props, member, transaction } = params;
    let { subjectId } = props
    const resultList: any = await this.CommonModel.sequelize.query(
        `
          SELECT tssh.ID
                ,tssh.SUBJECT_ID
                ,tssh.ORGANIZATION_CD
                ,tog.ORGANIZATION_NM AS ORGANIZATION_NM
                ,tpo.NICKNAME 
                ,tssh.REQUEST_TYPE_CD
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tssh.REQUEST_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'REQUEST_TYPE') AS REQUEST_TYPE_CD_NM
                ,tssh.CHANGE_DTM
                ,tssh.CHANGE_USER_LOGIN_ID
                ,(SELECT CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR)
                    FROM TB_USER tu 
                   WHERE tu.LOGIN_ID = tssh.CHANGE_USER_LOGIN_ID 
                 ) AS CHANGE_USER_NM
                ,tssh.CHANGE_MEMBER_LOGIN_ID
                ,(SELECT CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR)
                    FROM TB_MEMBER tm 
                   WHERE tm.LOGIN_ID = tssh.CHANGE_MEMBER_LOGIN_ID 
                 ) AS CHANGE_MEMBER_NM
                ,tssh.SCREENING_DATE
                ,tssh.SCREENING_TIME
                ,tssh.STATUS_CD
                ,(SELECT tcc.COMM_CD_NM FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tssh.STATUS_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'SCREEN_HIST_STATUS') AS STATUS_CD_NM
                ,tssh.CREATE_MEMBER_LOGIN_ID
                ,tssh.CREATE_USER_LOGIN_ID
                ,tssh.CREATE_DTM
                ,tssh.MODIFY_MEMBER_LOGIN_ID
                ,tssh.MODIFY_USER_LOGIN_ID
                ,tssh.MODIFY_MEMBER_DTM
                ,tssh.MODIFY_USER_DTM
        FROM TB_SUBJECT_SCREENING_HIST tssh
       INNER JOIN TB_SUBJECT ts ON ts.ID = tssh.SUBJECT_ID
       INNER JOIN TB_ORGANIZATION tog ON tog.ORGANIZATION_CD = ts.ORGANIZATION_CD 
                                     AND tog.DELETE_YN = 'N'
       INNER JOIN TB_PROJECT_ORGANIZATION tpo ON tpo.PROTOCOL_NO = ts.PROTOCOL_NO
                                             AND tpo.ORGANIZATION_CD = tog.ORGANIZATION_CD
          WHERE 1=1
            AND tssh.SUBJECT_ID = :id
          ORDER BY tssh.CREATE_DTM DESC
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
