import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectBoardController } from './projectboard.controller';
import { ProjectBoardService } from './projectboard.service';
import { ProjectBoardQuery } from './projectboard.queries';
import { COMMON } from 'src/entitys/common/common.model';
import { AppService } from 'src/app.service';
import { Crypto } from 'src/lib/crypto';
import { CloudApi } from 'src/lib/cloud-api';
@Module({
    imports: [SequelizeModule.forFeature([COMMON])],
    controllers: [ProjectBoardController],
    providers: [
        ProjectBoardService,
        ProjectBoardQuery,
        AppService,
        Crypto,
        CloudApi
    ],
})
export class ProjectBoardModule {}
