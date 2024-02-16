import { ApiProperty } from '@nestjs/swagger';

//사용자 상태변경 DTO
export class UserChgPwdDateDto {
  @ApiProperty({ description: '사용자 아이디', required : true })
  userId: string;
}