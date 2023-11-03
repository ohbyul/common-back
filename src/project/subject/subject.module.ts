import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { SubjectQuery } from './subject.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { ExaminationService } from '../examination/examination.service';
import { ExaminationQuery } from '../examination/examination.queries';
import { ScreeningQuery } from '../screening/screening.queries';
import { ScreeningService } from '../screening/screening.service';
import { ProjectQuery } from '../project/project.queries';
import { ParticipantQuery } from '../participant/participant.queries';
import { CommonQuery } from 'src/common/common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { ReqRes } from 'src/lib/req-res';
import { Crypto } from 'src/lib/crypto';
import { ConsentQuery } from '../consent/consent.queries';
import { CounselQuery } from '../counsel/counsel.queries';
import { SurveyService } from '../survey/survey.service';
import { SurveyQuery } from '../survey/survey.queries';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [SubjectController],
  providers: [
    SubjectService,
    SubjectQuery,
    ScreeningQuery,
    ExaminationService,
    ExaminationQuery,
    ScreeningService,
    ProjectQuery,
    ParticipantQuery,
    CommonQuery,
    SMSSender,
    ReqRes,
    Crypto,
    ConsentQuery,
    CounselQuery,
    SurveyService,
    SurveyQuery
  ],
})
export class SubjectModule {}
