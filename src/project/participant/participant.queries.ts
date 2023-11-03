import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class ParticipantQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  /*************************************************
   * 참여기관 조회 by uniqe key   
   * 
   * @param 
   * @returns 
   ************************************************/
  async getProjectOrganizationList(params: any) {
    let { props , member , transaction } = params;
    let { protocolNoOrigin } = props

    const result: any = await this.CommonModel.sequelize.query(
      `
        SELECT tpo.ID AS PROJECT_ORGANIZATION_ID
              ,tpo.ORGANIZATION_CD 
              ,tog.ORGANIZATION_NM
              ,tog.ORGANIZATION_TYPE_CD 
              ,tog.REGION 
              ,tog.ZIP_CODE 
              ,tog.ADDRESS 
              ,tog.ADDRESS_DETAIL 
              ,tog.CEO 
              ,tpo.PROTOCOL_NO 
              ,tpo.PARTICIPANT_TYPE_CD 
              ,tpo.NICKNAME 
              ,tpo.CONTACT_NO 
              ,tpo.IRB_APPROVAL_DATE 
              ,tpo.RECRUIT_START_DATE 
              ,tpo.RECRUIT_END_DATE 
              ,tpo.CONSENT_TYPE_CD 
              ,(SELECT tcc.COMM_CD_NM  FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpo.CONSENT_TYPE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'CONSENT_TYPE') AS CONSENT_TYPE_NM
              ,tpo.RECRUIT_NUMBER 
              ,tpo.REFER 
              ,tpo.SCREENING_START_DATE 
              ,tpo.SCREENING_END_DATE 
              ,tpo.SCREENING_TIME 
              ,tpo.DISPLAY_YN 
              ,tpo.WRITE_LOGIN_ID 
              ,tpo.WRITE_DTM 
              ,tpo.DELETE_YN
         FROM TB_PROJECT_ORGANIZATION tpo
        INNER JOIN TB_ORGANIZATION tog ON tpo.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
        INNER JOIN TB_COMM_CD tcc2 ON tcc2.COMM_CD = tpo.PARTICIPANT_TYPE_CD AND tcc2.GROUP_CD = 'PARTICIPANT_TYPE' AND tcc2.DELETE_YN = 'N'
        WHERE 1=1
          AND tpo.PROTOCOL_NO = :protocolNoOrigin
        ORDER BY tcc2.SORT_ORDER ASC , tog.ORGANIZATION_NM ASC
      `,  
      { 
        replacements: {
          protocolNoOrigin:protocolNoOrigin,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }


  /*************************************************
   * 참여 연구원 리스트 조회 by 프로토콜 + 조직Cd
   * 
   * @param 
   * @returns 
   ************************************************/
  async getProjectParticipantList(params: any) {
    let { props , member , transaction , org } = params;
    let { protocolNoOrigin } = props
    let { organizationCd } = org
    const result: any = await this.CommonModel.sequelize.query(
      `
        SELECT tpp.ID AS PROJECT_PARTICIPANT_ID
              ,tpp.ORGANIZATION_CD
              ,tog.ORGANIZATION_NM
              ,tpp.PROTOCOL_NO
              ,tpp.PARTICIPANT_LOGIN_ID
              ,tpp.ROLE_CD
              ,(SELECT tcc.COMM_CD_NM  FROM TB_COMM_CD tcc WHERE tcc.COMM_CD = tpp.ROLE_CD AND tcc.DELETE_YN = 'N' AND tcc.GROUP_CD = 'ROLE') AS ROLE_CD_NM
              ,tpp.PARTICIPANT_EMAIL
              ,tpp.PARTICIPANT_NM
              ,tpp.EMAIL_SEND_YN
              ,tpp.EMAIL_SEND_DTM
              ,tpp.MANAGE_ORG_LIST
              ,tpp.ACCESS_RESTRAINT_YN
              ,tpp.WRITE_LOGIN_ID
              ,tpp.WRITE_DTM
              ,tpp.DELETE_YN 
         FROM TB_PROJECT_PARTICIPANT tpp 
        INNER JOIN TB_ORGANIZATION tog ON tpp.ORGANIZATION_CD = tog.ORGANIZATION_CD AND tog.DELETE_YN = 'N'
        WHERE 1=1
          AND tpp.ORGANIZATION_CD = :organizationCd
          AND tpp.PROTOCOL_NO = :protocolNoOrigin
        ORDER BY tpp.WRITE_DTM ASC
      `,  
      { 
        replacements: {
          organizationCd:organizationCd,
          protocolNoOrigin:protocolNoOrigin,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }

  /*************************************************
   * 권한 조회
   * 
   * @param 
   * @returns 
   ************************************************/
  async getParticipantRole(params: any) {
    let { props , member , transaction , item } = params;
    let { PROJECT_PARTICIPANT_ID } = item
    const result: any = await this.CommonModel.sequelize.query(
      `
        SELECT tppr.ID 
              ,tppr.PARTICIPANT_ID
              ,tppr.MENU_ID 
              ,tm.MENU_NM
              ,tm.UPPER_MENU_ID 
              ,tm.MENU_URL 
              ,tppr.PERMISSION_CD 
        FROM TB_PROJECT_PARTICIPANT_ROLE tppr 
        INNER JOIN TB_MENU tm ON tppr.MENU_ID = tm.MENU_ID AND tm.DELETE_YN = 'N'
        WHERE 1=1
          AND tppr.PARTICIPANT_ID = :projectParticipantId
      `,  
      { 
        replacements: {
          projectParticipantId:PROJECT_PARTICIPANT_ID,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }
  
}
