import { ApiProperty } from '@nestjs/swagger';

//게시판 DTO
export class createBoardDto {
  @ApiProperty({ description: '게시글 제목', required: true })
  title: string;

  @ApiProperty({ description: '게시글 내용', required: true })
  contents: string;

  @ApiProperty({ description: '게시글 유효 시작 일시', required: true})
  startDate: string;

  @ApiProperty({ description: '게시글 유효 종료 일시', required: true })
  endDate: string;

}
