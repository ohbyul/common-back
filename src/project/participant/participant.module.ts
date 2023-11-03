import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ParticipantController } from './participant.controller';
import { ParticipantService } from './participant.service';
import { ParticipantQuery } from './participant.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { ProjectQuery } from '../project/project.queries';
import { ConsentQuery } from '../consent/consent.queries';

@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [ParticipantController],
  providers: [
    ParticipantService,
    ParticipantQuery,
    ProjectQuery,
    ConsentQuery
    
  ],
})
export class ParticipantModule {}
