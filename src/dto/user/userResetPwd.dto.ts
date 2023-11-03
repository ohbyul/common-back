import { ApiProperty } from '@nestjs/swagger';

//사용자 비밀번호 리셋 DTO
export class UserResetPwdDto {
  @ApiProperty({ description: '사용자 아이디', required : true })
  userId: string;

  @ApiProperty({ description: '새 비밀번호', required : true })
  userPwd: string;
  
}
