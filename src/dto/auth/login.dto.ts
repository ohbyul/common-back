import { ApiProperty } from '@nestjs/swagger';

//로그인 DTO
export class LoginDto {
  @ApiProperty({ description: '회원 계정', required : true })
  memberId: string;

  @ApiProperty({ description: '회원 패스워드', required : true })
  memberPwd: string;

  @ApiProperty({ description: '브라우저 정보', required : false })
  memberAgent: string;

  @ApiProperty({ description: 'clientIP', required : false })
  ip: string;
}
