import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthQuery } from './auth.queries';
import { JwtStrategy } from './jwt.strategy';
import { COMMON } from 'src/entitys/common/common.model';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { ReqRes } from 'src/lib/req-res';
import { Crypto } from 'src/lib/crypto';
import { MemberModule } from 'src/member/member.module';
import { MemberQuery } from 'src/member/member.queries';

@Module({
  imports: [
    SequelizeModule.forFeature([COMMON]),
    JwtModule.register({
      secret: `${process.env.JWT_TOKEN_SECRET}`,
      signOptions: { expiresIn: '6h' },
    }),
    MemberModule,
  ],
  providers: [
    AuthService,
    AuthQuery,
    MemberQuery,
    JwtStrategy,
    CommonQuery,
    SMSSender,
    ReqRes,
    Crypto
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
