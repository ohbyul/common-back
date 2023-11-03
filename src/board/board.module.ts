import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardQuery } from './board.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { AppService } from 'src/app.service';
import { Crypto } from 'src/lib/crypto';
import { CloudApi } from 'src/lib/cloud-api';
@Module({
  imports: [SequelizeModule.forFeature([COMMON])],
  controllers: [BoardController],
  providers: [
    BoardService,
    BoardQuery,
    AppService,
    Crypto,
    CloudApi
  ],
})
export class BoardModule {}
