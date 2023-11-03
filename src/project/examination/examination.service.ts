import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { ExaminationQuery } from './examination.queries';

@Injectable()
export class ExaminationService {
  constructor(
    private examinationQuery: ExaminationQuery,
  ) {}

  /*************************************************
   * 문진 조회
   * 
   * @returns 
   ************************************************/
  async getProjectExaminationList(params : any) {
    let { props , transaction } = params;
    let { examinationList , protocolNoOrigin } = props

    let examinations : any = await this.examinationQuery.getProjectExaminationList({...params});
    for(let exam of examinations){
      let items : any = await this.examinationQuery.getProjectExaminationItemList({...params , exam});
      exam['examinationItemList'] = items
    }

    return examinations
  }

  /*************************************************
   * 문진 결과 생성
   * 
   * @returns 
   ************************************************/
  async insertExaminationResult(params : any) {
    let { props , member , transaction } = params;
    let { examinationList } = props

    for(let exam of examinationList) {
      if(exam.resultItemId){

        exam['examinationId'] = exam.id

        if(exam.questionTypeCd === 'SINGLE_SELECT' ){
          exam['examinationItemId'] = exam.resultItemId  
          let result: any = await this.examinationQuery.insertExaminationResult({...params , exam});
        }
        
        else
        if(exam.questionTypeCd === 'MULTI_SELECT' ){
          let resultItemList = exam.resultItemId
          for(let resultItem of resultItemList){
            exam['examinationItemId'] = resultItem
            let result: any = await this.examinationQuery.insertExaminationResult({...params,exam});
          }
        }

      }
    }

  }
 
  /*************************************************
   * 문진 결과 조회
   * 
   * @returns 
   ************************************************/
  async getSubjectExaminationResult(params : any) {
    let { props , member , transaction } = params;
    let { subjectId , id , protocolNoOrigin } = props

    // 질문
    let examinations : any = await this.examinationQuery.getProjectExaminationList({...params});
    for(let exam of examinations){
      // 보기
      let items : any = await this.examinationQuery.getProjectExaminationItemList({...params , exam});
      exam['examinationItemList'] = items
      // 정답
      let result : any = await this.examinationQuery.getSubjectExaminationResult({...params , exam});
      exam['resultItem'] = result
      if(result){
        exam['resultItemId'] = result?.EXAMINATION_ITEM_ID
      }else{
        exam['resultItemId'] = null
      }

    }

    return examinations
  }



  
}
