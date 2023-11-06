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

@Module({
  imports: [
    SequelizeModule.forFeature([COMMON]),
    JwtModule.register({
      secret: `${process.env.JWT_TOKEN_SECRET}`,
      signOptions: { expiresIn: '6h' },
    }),
  ],
  providers: [
    AuthService,
    AuthQuery,
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
