import { ApiProperty } from '@nestjs/swagger';

//회원가입 DTO
export class SignUpDto {
  @ApiProperty({ description: '그룹코드: SYSTEM_TYPE (PORTAL: 자체포털생성 사용자, SSO: SSO 생성 사용자)' })
  createSystemCd: string;

  @ApiProperty({ description: '사업자번호' })
  organizationCd: number;

  @ApiProperty({ description: '직책', required: true})
  position: string;

  @ApiProperty({ description: '사용자명' })
  userNm: string;

  @ApiProperty({ description: '사용자 아이디' })
  userId: string;

  @ApiProperty({ description: '사용자 패스워드' })
  userPwd: string;
}
