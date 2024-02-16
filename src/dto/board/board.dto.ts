import { ApiProperty } from '@nestjs/swagger';


//게시판 DTO

export class BoardDto {
  @ApiProperty({ description: '게시글 id' })
  id: string;

  @ApiProperty({ description: '게시글 제목'})
  title: string;

  @ApiProperty({ description: '게시글 내용' })
  contents: string;

  @ApiProperty({ description: '게시판 종류' })
  bbsKindCd: string;

  @ApiProperty({ description: '노출 여부' })
  displayYn: string;

  @ApiProperty({ description: '게시글' })
  body: string[];
}