import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { SurveyQuery } from './survey.queries';
import { SubjectQuery } from '../subject/subject.queries';

@Injectable()
export class SurveyService {
  constructor(
    private surveyQuery: SurveyQuery,
    private subjectQuery: SubjectQuery,
  ) {}

  /*************************************************
   * 신청자 임상완료 설문 조회
   * 
   * @param 
   * @returns 신청자 임상완료 설문 조회
   ************************************************/
  async getProjectSurveyList(params : any) {
    let { props , member , transaction } = params;

    //[1] 질문 조회
    let questionList: any = await this.surveyQuery.getSurveyQuestionList({...params});

    //[2] 보기 조회
    for(let question of questionList){
      let items : any = await this.surveyQuery.getSurveyQuestionItemList({...params , question});
      question['surveyItemList'] = items
      //[3]결과 조회
      let result : any = await this.surveyQuery.getSurveyQuestionResult({...params , question});
      question['resultItem'] = result
        if(result){
          question['resultItemId'] = result?.EXAMINATION_ITEM_ID
        }else{
          question['resultItemId'] = null
        }
    }

    return questionList
  }

  /*************************************************
   * 임상완료 설문 결과 생성
   * 
   * @returns 
   ************************************************/
  async insertSurveyResult(params : any) {
    let { props , member , transaction } = params;
    let { subjectId,surveyList } = props

    // [1]  결과생성
    for(let survey of surveyList) {
      if(survey.resultItem){

        survey['surveyId'] = survey.id

        // 라디오
        if(survey.questionTypeCd === 'SINGLE_SELECT' ){
          let resultItem = survey.resultItem[0]
          resultItem['surveyItemId']=resultItem?.id
          survey['resultItem'] = resultItem
          let result: any = await this.surveyQuery.insertSurveyResult({...params , survey});
        }
        
        // 체크박스
        else
        if(survey.questionTypeCd === 'MULTI_SELECT' ){
          let resultItemList = survey.resultItem
          for(let resultItem of resultItemList){
            resultItem['surveyItemId']=resultItem?.id
            survey['resultItem'] = resultItem
            let result: any = await this.surveyQuery.insertSurveyResult({...params,survey});
          }
        }

        // 인풋박스
        else
        if(survey.questionTypeCd === 'INPUT' ){
          survey['resultItem'] = survey.resultItem[0]
          let result: any = await this.surveyQuery.insertSurveyResult({...params,survey});
        }

      }
    }

    // [2] 설문완료 여부 업데이트
    props['surveyYn']='Y'
    let survey: any = await this.subjectQuery.updateSubjectSurveyYn({...params});

    return {
      statusCode: 10000,
      message: '정상적으로 저장되었습니다.',
    };
  }
 


}
