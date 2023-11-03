import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ExaminationController } from './examination.controller';
import { ExaminationService } from './examination.service';
import { ExaminationQuery } from './examination.queries';
import { COMMON } from 'src/entitys/common/common.model';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [ExaminationController],
  providers: [
    ExaminationService,
    ExaminationQuery,
  ],
})
export class ExaminationModule {}
