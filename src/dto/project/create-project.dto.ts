import { ApiProperty } from '@nestjs/swagger';

//프로젝트 DTO
export class createProjectDto {
  @ApiProperty({ description: '프로젝트 아이디' })
  id: string;

  @ApiProperty({ description: '프로토콜NO (임사시험 정보에서 유니크한 값)', required: true })
  protocolNo: string;

  @ApiProperty({ description: '임상시험제목(국문)' })
  trialTitle: string;

  @ApiProperty({ description: '임상시험제목(영문)'})
  trialTitleEng: string;

  @ApiProperty({ description: 'Dtx 제폼코드 (치료기기와 연동시 사용되는 제품코드)'})
  productCd: string;

  @ApiProperty({ description: 'Dtx 제품명'})
  productNm: string;
  
  @ApiProperty({ description: '임상시험단계(탐색임상 : QUEST, 확증임상 : CONFIRMATION,연구자임상 : RESEARCH)  GROUP_CD : TRIAL_STEP_TYPE'})
  trialStepTypeCd: string;
  
  @ApiProperty({ description: '임상시험시작일자'})
  trialStartDate: string;
  
  @ApiProperty({ description: '임상시험종료일자'})
  trialEndDate: string;
  
  @ApiProperty({ description: '임상시험승인일자'})
  trialApprovalDate: string;
  
  @ApiProperty({ description: '임상시험목적'})
  trialPurpose: string;
  
  @ApiProperty({ description: '임상시험용도'})
  trialUsage: string;
  
  @ApiProperty({ description: '국내외구분(국내 : DOMESTIC,국외 : OVERSEA,다국가 : ALL) GROUP_CD : NATION_TYPE'})
  nationTypeCd: string;
  
  @ApiProperty({ description: '국내외상세구분(단일기관 : SINGLE ,다기관 : MULTI ) GROUP_CD : NATION_DTL_TYPE'})
  nationDtlTypeCd: string;
  
  @ApiProperty({ description: '키워드(‘;’delimiter 로 구분한 목록) GROUP_CD : KEYWORD'})
  keywordList: [];
  
  @ApiProperty({ description: '1'})
  postTitle: string;

  @ApiProperty({ description: '1'})
  researchStartDate: string;

  @ApiProperty({ description: '1'})
  researchEndDate: string;

  @ApiProperty({ description: '1'})
  postStartDate: string;

  @ApiProperty({ description: '1'})
  postEndDate: string;

  @ApiProperty({ description: '1'})
  rewardInfo: string;

  @ApiProperty({ description: '1'})
  rewardDisplayYn: string;

  @ApiProperty({ description: '1'})
  selectionInfo: string;

  @ApiProperty({ description: '1'})
  constraintInfo: string;

  @ApiProperty({ description: '1'})
  dtxInfo: string;

  @ApiProperty({ description: '1'})
  surveyTitle: string;

  @ApiProperty({ description: '1'})
  surveyContents: string;

  @ApiProperty({ description: '1'})
  surveyStartYn: string;

  @ApiProperty({ description: '1'})
  statusCd: string;

  @ApiProperty({ description: '1'})
  displayYn: string;

  @ApiProperty({ description: '1'})
  deleteYn: string;


}
