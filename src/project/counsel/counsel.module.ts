import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CounselController } from './counsel.controller';
import { CounselService } from './counsel.service';
import { CounselQuery } from './counsel.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { ProjectQuery } from '../project/project.queries';
import { ParticipantQuery } from '../participant/participant.queries';
import { SubjectQuery } from '../subject/subject.queries';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { ReqRes } from 'src/lib/req-res';
import { Crypto } from 'src/lib/crypto';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [CounselController],
  providers: [
    CounselService,
    CounselQuery,
    ProjectQuery,
    ParticipantQuery,
    SubjectQuery,
    CommonQuery,
    SMSSender,
    ReqRes,
    Crypto,
  ],
})
export class CounselModule {}
