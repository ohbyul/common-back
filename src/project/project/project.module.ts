import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectQuery } from './project.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { ParticipantService } from '../participant/participant.service';
import { ParticipantQuery } from '../participant/participant.queries';
import { ExaminationService } from '../examination/examination.service';
import { ExaminationQuery } from '../examination/examination.queries';
import { ConsentService } from '../consent/consent.service';
import { ConsentQuery } from '../consent/consent.queries';
import { SubjectQuery } from '../subject/subject.queries';
import { ScreeningQuery } from '../screening/screening.queries';
import { CommonQuery } from 'src/common/common.queries';
import { CounselQuery } from '../counsel/counsel.queries';
import { MemberQuery } from 'src/member/member.queries';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectQuery,
    ParticipantService,
    ParticipantQuery,
    ExaminationService,
    ExaminationQuery,
    ConsentService,
    ConsentQuery,
    SubjectQuery,
    ScreeningQuery,
    CommonQuery,
    CounselQuery,
    MemberQuery
  ],
})
export class ProjectModule {}
