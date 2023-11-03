import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Request, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.JWT_TOKEN_SECRET}`,
    });
  }

  async validate(payload: any) {
    if (payload) {
      return { 
        memberId: payload.memberId,
        status: payload.status,
        memberNm: payload.memberNm,
        useRestrictionYn:payload.useRestrictionYn,
        loginRestrictionYn:payload.loginRestrictionYn,
     };
    } else {
      throw new UnauthorizedException('회원 정보 조회 실패');
    }
  }
}
