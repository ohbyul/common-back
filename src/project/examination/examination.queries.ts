import { Inject, Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { COMMON } from 'src/entitys/common/common.model';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class ExaminationQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON
  ) {}
  /*************************************************
   * 문진 결과 생성
   * 
   * @returns 
   ************************************************/
  async insertExaminationResult(params : any) {
    let { props, member , exam, transaction} = params
    let { memberId } = member
    let { examinationId , examinationItemId } = exam
    let { subjectId } = props

    let result : any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_SUBJECT_EXAMINATION_RESULT ( 
             SUBJECT_ID
             ,EXAMINATION_ID
             ,EXAMINATION_ITEM_ID
             ,INPUT_VALUE
             ,CREATE_DTM , CREATE_LOGIN_ID , MODIFY_DTM , MODIFY_LOGIN_ID 
      )VALUES( :subjectId  
            ,:examinationId
            ,:examinationItemId
            ,null
            ,now() , :memberId, now(), :memberId
          )
      `,
      {
        replacements: {
          subjectId: subjectId,
          examinationId: examinationId,
          examinationItemId: examinationItemId,
          memberId: memberId,
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
        raw: true 
      },
    );

    return result[0];
  }

  /*************************************************
   * 문진 문항 조회 by uniqe key   
   * 
   * @param 
   * @returns 
   ************************************************/
  async getProjectExaminationList(params: any) {
    let { props  , transaction } = params;
    let { protocolNoOrigin } = props

    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tpe.ID
                ,tpe.PROTOCOL_NO 
                ,tpe.QUESTION_NM 
                ,tpe.QUESTION_TYPE_CD 
                ,tpe.MANDATORY_YN 
                ,tpe.SORT_ORDER 
                ,tpe.DELETE_YN
          FROM TB_PROJECT_EXAMINATION tpe 
         WHERE 1=1
           AND tpe.DELETE_YN = 'N'
           AND tpe.PROTOCOL_NO = :protocolNoOrigin
         ORDER BY tpe.SORT_ORDER ASC
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
   * 문진 보기 조회
   * 
   * @param 
   * @returns 
   ************************************************/
  async getProjectExaminationItemList(params: any) {
    let { props , transaction , exam } = params;
    let { protocolNoOrigin } = props
    let { ID } = exam
    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tpei.ID
                ,tpei.EXAMINATION_ID 
                ,tpei.ITEM_NM  
                ,tpei.APPLY_RESTRAINT_YN  
                ,tpei.SORT_ORDER 
                ,tpei.DELETE_YN
            FROM TB_PROJECT_EXAMINATION_ITEM tpei 
           WHERE 1=1
             AND tpei.DELETE_YN = 'N'
             AND tpei.EXAMINATION_ID = :id
           ORDER BY tpei.SORT_ORDER ASC
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
   * 문진 결과 조회
   * 
   * @param 
   * @returns 
   ************************************************/
  async getSubjectExaminationResult(params: any) {
    let { props , member , transaction , exam } = params;
    let { subjectId } = props
    let { ID } = exam
    const result: any = await this.CommonModel.sequelize.query(
      `
          SELECT tser.ID 
                ,tser.SUBJECT_ID 
                ,tser.EXAMINATION_ID 
                ,tser.EXAMINATION_ITEM_ID 
                ,tser.INPUT_VALUE 
                ,tser.CREATE_DTM 
           FROM TB_SUBJECT_EXAMINATION_RESULT tser 
          WHERE 1=1
            AND tser.SUBJECT_ID = :subjectId
            AND tser.EXAMINATION_ID = :id
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

    return result[0];
  }
  
  
}
