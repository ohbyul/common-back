import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';;
import { MemberController } from './member.controller';;
import { MemberQuery } from './member.queries';
import { MemberService } from './member.service';
import { AuthQuery } from 'src/auth/auth.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { EmailSender } from 'src/lib/email-sender';
import { ReqRes } from 'src/lib/req-res';
import { Crypto } from 'src/lib/crypto';
import { CloudApi } from 'src/lib/cloud-api';

@Module({
  imports: [
    SequelizeModule.forFeature([COMMON])
  ],
  controllers: [MemberController],
  providers: [MemberService, 
              MemberQuery, 
              AuthQuery, 
              CommonQuery,     
              SMSSender,
              EmailSender,
              ReqRes,
              Crypto,
              CloudApi,
            ],
  exports: [MemberService],
})
export class MemberModule {}
