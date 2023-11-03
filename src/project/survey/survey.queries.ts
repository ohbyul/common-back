import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class SurveyQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}
  /*************************************************
   * 임상완료설문 질문 리스트
   * 
   * @returns  임상완료설문 질문 리스트
   ************************************************/
  async getSurveyQuestionList(params :any) {
    let { props , member , transaction} = params
    let {protocolNo } = props
    let { memberId } = member

    let resultList: any = await this.CommonModel.sequelize.query(
      `
        SELECT tps.ID
              ,tps.PROTOCOL_NO 
              ,tps.QUESTION_NM 
              ,tps.QUESTION_TYPE_CD 
              ,tps.MANDATORY_YN
              ,tps.DESCRIPTION_YN 
              ,tps.SORT_ORDER 
              ,tps.DELETE_YN
         FROM TB_PROJECT_SURVEY tps 
        WHERE 1=1
          AND tps.DELETE_YN = 'N'
          AND tps.PROTOCOL_NO = :protocolNo
        ORDER BY tps.SORT_ORDER ASC
      `,
        { 
          replacements : {
            protocolNo:protocolNo,
          },
          type: QueryTypes.SELECT,transaction ,
          mapToModel: true,
        },
      );

    return resultList;
  }

  /*************************************************
   * 임상완료설문 보기 조회
   * 
   * @param 
   * @returns 
   ************************************************/
  async getSurveyQuestionItemList(params: any) {
    let { props , member , transaction , question } = params;
    let { ID } = question

    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tpsi.ID
                ,tpsi.SURVEY_ID  
                ,tpsi.ITEM_NM  
                ,tpsi.ADD_INPUT_YN
                ,tpsi.SORT_ORDER 
                ,tpsi.DELETE_YN
            FROM TB_PROJECT_SURVEY_ITEM tpsi 
           WHERE 1=1
             AND tpsi.DELETE_YN = 'N'
             AND tpsi.SURVEY_ID = :id
           ORDER BY tpsi.SORT_ORDER ASC
      `,  
      { 
        replacements: {
          id:ID,
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }

  /*************************************************
   * 임상완료설문 결과 조회 
   * 
   * @param 
   * @returns 
   ************************************************/
  async getSurveyQuestionResult(params: any) {
    let { props , member , transaction , question } = params;
    let { ID } = question
    let { subjectId } = props

    const result: any = await this.CommonModel.sequelize.query(
      `
        SELECT tssr.ID 
              ,tssr.SUBJECT_ID 
              ,tssr.SURVEY_ID 
              ,tssr.SURVEY_ITEM_ID 
              ,tssr.INPUT_VALUE 
              ,tssr.ADD_INPUT_VALUE 
         FROM TB_SUBJECT_SURVEY_RESULT tssr 
        WHERE 1=1
          AND tssr.SURVEY_ID = :id
          AND tssr.SUBJECT_ID = :subjectId
      `,  
      { 
        replacements: {
          id:ID,
          subjectId:subjectId
        },
        type: QueryTypes.SELECT, transaction,
        mapToModel: true,
      },
    );

    return result;
  }

  /*************************************************
   * 문진 결과 생성
   * 
   * @returns 
   ************************************************/
  async insertSurveyResult(params : any) {
    let { props, member , survey, transaction} = params
    let { subjectId } = props
    let { memberId } = member
    let { surveyId , resultItem } = survey
    let { surveyItemId,inputValue ,addInputValue } = resultItem

    let result : any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_SUBJECT_SURVEY_RESULT ( 
             SUBJECT_ID
             ,SURVEY_ID
             ,SURVEY_ITEM_ID
             ,INPUT_VALUE
             ,ADD_INPUT_VALUE
             ,CREATE_DTM , CREATE_LOGIN_ID , MODIFY_DTM , MODIFY_LOGIN_ID 
      )VALUES( :subjectId  
            ,:surveyId
            ,:surveyItemId
            ,:inputValue
            ,:addInputValue
            ,now() , :memberId, now(), :memberId
          )
      `,
      {
        replacements: {
          subjectId: subjectId,
          surveyId: surveyId,
          surveyItemId:surveyItemId??null,
          inputValue: inputValue??null,
          addInputValue: addInputValue??null,
          memberId: memberId,
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
        raw: true 
      },
    );

    return result[0];
  }

}
