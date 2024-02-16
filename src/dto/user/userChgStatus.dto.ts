import { ApiProperty } from '@nestjs/swagger';

//사용자 상태변경 DTO
export class UserChgStatusDto {
  @ApiProperty({ description: '사용자 아이디', required : true })
  userId: string;

  @ApiProperty({ 
        enum: ['APPROVAL' , 'REJECT' , 'DELETE'],
        description: '사용자 상태', 
        required : true
    })
  status_cd: string;
  
}
