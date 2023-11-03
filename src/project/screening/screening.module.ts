import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScreeningController } from './screening.controller';
import { ScreeningService } from './screening.service';
import { ScreeningQuery } from './screening.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { ParticipantQuery } from '../participant/participant.queries';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { ReqRes } from 'src/lib/req-res';
import { Crypto } from 'src/lib/crypto';
import { SubjectQuery } from '../subject/subject.queries';
import { ProjectQuery } from '../project/project.queries';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [ScreeningController],
  providers: [
    ScreeningService,
    ScreeningQuery,
    ParticipantQuery,
    CommonQuery,
    SubjectQuery,
    ProjectQuery,
    SMSSender,
    ReqRes,
    Crypto,
  ],
})
export class ScreeningModule {}
