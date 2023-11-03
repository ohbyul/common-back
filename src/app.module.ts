import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './interceptor/http-exception.filter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionInterceptor } from './interceptor/transaction.interceptor';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { COMMON } from './entitys/common/common.model';

import { AuthModule } from './auth/auth.module';
import { MemberModule } from './member/member.module';

import { CommonModule } from './common/common.module';

import { ProjectModule } from './project/project/project.module';
import { ParticipantModule } from './project/participant/participant.module';
import { ExaminationModule } from './project/examination/examination.module';
import { ConsentModule } from './project/consent/consent.module';
import { SubjectModule } from './project/subject/subject.module';
import { ScreeningModule } from './project/screening/screening.module';
import { CounselModule } from './project/counsel/counsel.module';
import { SurveyModule } from './project/survey/survey.module';

import { BoardModule } from './board/board.module';
import { ProjectBoardModule } from './project/projectboard/projectboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.code'],
    }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      timezone: "+09:00",
      synchronize: true,
      pool: {
        acquire: 10000,
        idle: 1000,
        max: 10,
        min: 5
      },
      logging: process.env.DATABASE_LOGGING == null ? false : process.env.DATABASE_LOGGING === 'true',
      models: [COMMON],
    }),
    AuthModule,
    MemberModule,
    ProjectModule,
    CommonModule,
    ParticipantModule,
    ExaminationModule,
    ConsentModule,
    SubjectModule,
    ScreeningModule,
    CounselModule,
    SurveyModule,
    BoardModule,
    ProjectBoardModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },

  ],
})
export class AppModule {}
