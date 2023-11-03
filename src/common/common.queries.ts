import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { MSGTemplatesDto } from 'src/dto/common/msg-templates.dto';

@Injectable()
export class CommonQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}

  /*************************************************
   * 그룹CD별 코드 리스트 조회   
   * 
   * @returns 그룹CD별 코드 리스트
   ************************************************/
  async getCommonCodeList(params : any) {
    let {props , transaction} = params
    let {groupCd} = props
    const resultList: any = await this.CommonModel.sequelize.query(
        `
          SELECT tcc.COMM_CD 
                ,tcc.GROUP_CD 
                ,tcc.COMM_CD_NM 
                ,tcc.COMM_CD_DESC 
                ,tcc.SORT_ORDER 
           FROM TB_COMM_GROUP_CD tcgc 
          INNER JOIN TB_COMM_CD tcc ON tcc.GROUP_CD = tcgc.GROUP_CD AND tcc.DELETE_YN = 'N'
            AND tcgc.DELETE_YN = 'N'
            AND tcgc.GROUP_CD = :groupCd
          ORDER BY tcc.SORT_ORDER ASC
        `,  
        { 
          replacements: {
            groupCd:groupCd,
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return resultList;
  }

  /*************************************************
   * 그룹CD별 코드 값 조회
   * 
   * @returns 그룹CD별 코드 리스트
   ************************************************/
  async getCommonCodeValue(params : any) {
    let {props , transaction} = params
    let {groupCd , commCd} = props

    const result: any = await this.CommonModel.sequelize.query(
        `
          SELECT tcc.COMM_CD 
                ,tcc.GROUP_CD 
                ,tcc.COMM_CD_NM 
                ,tcc.COMM_CD_DESC 
                ,tcc.SORT_ORDER 
           FROM TB_COMM_GROUP_CD tcgc 
          INNER JOIN TB_COMM_CD tcc ON tcc.GROUP_CD = tcgc.GROUP_CD AND tcc.DELETE_YN = 'N'
            AND tcgc.DELETE_YN = 'N'
            AND tcgc.GROUP_CD = :groupCd
            AND tcc.COMM_CD = :commCd
          ORDER BY tcc.SORT_ORDER ASC
        `,  
        { 
          replacements: {
            groupCd:groupCd,
            commCd:commCd
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return result[0];
  }

  /*************************************************
   * 키워드 코드값 조회
   * 
   * @returns 키워드 코드값 조회
   ************************************************/
  async getCommonCdKeyword(params : any) {
    let {props , transaction} = params
    let {groupCd , keyword} = props

    const result: any = await this.CommonModel.sequelize.query(
        `
        SELECT IFNULL(MAX(tccd.COMM_CD) , :keyword) AS keyword
          FROM TB_COMM_CD tccd 
         WHERE tccd.GROUP_CD = :groupCd
           AND tccd.DELETE_YN = 'N'
           AND tccd.COMM_CD_NM like '%${keyword}%'
         LIMIT 1
        `,  
        { 
          replacements: {
            groupCd:groupCd,
            keyword:keyword
          },
          type: QueryTypes.SELECT, transaction ,
          mapToModel: true,
        },
      );

    return result[0]?.keyword;
  }

  /*************************************************
   * 메세지 템플릿 조회
   * 
   * @returns 발송메세지 템플릿 코드 리스트
   ************************************************/
  async getMSGTemplates(params : any) : Promise<MSGTemplatesDto> {
    let {taskTypeCd} = params
    const resultList: any = await this.CommonModel.sequelize.query(
        `
        SELECT ID as id
              ,MSG_TYPE_CD as msgTypeCd
              ,TASK_TYPE_CD as taskTypeCd
              ,SENDER as sender
              ,TITLE as title
              ,CONTENTS as contents
              ,FILE_NM as fileNm
              ,FILE_PATH as filePath
          FROM TB_MSG_TEMPLATES
         WHERE TASK_TYPE_CD = :taskTypeCd  
        `,  
        { 
          replacements: {
            taskTypeCd:taskTypeCd,
          },
          type: QueryTypes.SELECT, 
          mapToModel: true,
        },
      );

    return resultList[0];
  }


  /*************************************************
   * 공개포탈 약관
   * 
   * @param 
   * @returns 공개포탈 약관 정보
   ************************************************/
  async getTerms(params: any) {
    let {props, transaction} = params
    let { termsTypeCd, termsKindCd } = props

    const terms: any = await this.CommonModel.sequelize.query(
      `
      SELECT tt.ID
            ,tt.TERMS_TYPE_CD
            ,tt.TERMS_KIND_CD
            ,tt.CONTENTS
            ,tt.START_DATE
            ,tt.END_DATE
            ,tt.CREATE_LOGIN_ID
            ,tt.CREATE_DTM
            ,tt.MODIFY_LOGIN_ID
            ,tt.MODIFY_DTM
        FROM TB_TERMS tt 
       WHERE TERMS_TYPE_CD = :termsTypeCd
         AND TERMS_KIND_CD = :termsKindCd
         AND DATE_FORMAT(NOW(), '%Y-%m-%d') BETWEEN START_DATE AND END_DATE
       ORDER BY tt.START_DATE DESC 
      `,
      {
        replacements: {
          termsTypeCd: termsTypeCd,
          termsKindCd: termsKindCd,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      }
    )
    return terms[0];
  }

   /*************************************************
   *    * 그룹CD & 상위공통 코드별 리스트 조회   
   * 
   * @returns 그룹CD & 상위공통 코드별  코드 리스트
   ************************************************/
   async getCommonUpperCodeList(params: any) {
      let {props , transaction} = params
      let {groupCd , upperCommCd} = props

      const resultList: any = await this.CommonModel.sequelize.query(
         `
         SELECT tcc.COMM_CD 
            ,tcc.GROUP_CD 
            ,tcc.COMM_CD_NM 
            ,tcc.COMM_CD_DESC 
            ,tcc.SORT_ORDER 
         FROM TB_COMM_GROUP_CD tcgc 
         INNER JOIN TB_COMM_CD tcc ON tcc.GROUP_CD = tcgc.GROUP_CD AND tcc.DELETE_YN = 'N'
            AND tcgc.DELETE_YN = 'N'
            AND tcgc.GROUP_CD = :groupCd
            AND tcc.UPPER_COMM_CD = :upperCommCd
         ORDER BY tcc.SORT_ORDER ASC
         `,  
         { 
            replacements: {
               groupCd: groupCd,
               upperCommCd: upperCommCd,
            },
            type: QueryTypes.SELECT, transaction ,
            mapToModel: true,
         },
      );

      return resultList;
   }




}
