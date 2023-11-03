import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyQuery } from './survey.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { SubjectQuery } from '../subject/subject.queries';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [SurveyController],
  providers: [
    SurveyService,
    SurveyQuery,
    SubjectQuery
  ],
})
export class SurveyModule {}
