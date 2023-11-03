import { ApiProperty } from '@nestjs/swagger';

//동의서 서명위치 DTO
export class createConsentCoordinateDto {
  @ApiProperty({ description: '사업자번호' })
  organizationCd: string;

  @ApiProperty({ description: '프로토콜NO' })
  protocolNo: string;

  @ApiProperty({ description: '동의서버전' })
  version: string;

  @ApiProperty({ description: '서명자구분(피험자 :SUBJECT,연구자 : RESEARCHER,연구책임자 : MANAGER)  GROUP_CD : SIGN_TYPE'})
  signTypeCd: string;

  @ApiProperty({ description: '위치'})
  coordinateInfo: [];

  @ApiProperty({ description: '이름위치'})
  nameCoordinate: [];

  @ApiProperty({ description: '서명위치'})
  signCoordinate: [];
  
  @ApiProperty({ description: '날짜위치'})
  dateCoordinate: [];
}
