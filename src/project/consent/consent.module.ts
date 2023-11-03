import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { ConsentQuery } from './consent.queries';
import { COMMON } from 'src/entitys/common/common.model';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [ConsentController],
  providers: [
    ConsentService,
    ConsentQuery,
  ],
})
export class ConsentModule {}
