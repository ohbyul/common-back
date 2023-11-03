import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Options,
  Req,
  UseGuards,
  UploadedFiles,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { TransactionParam } from 'src/decorator/transaction.deco';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { Transaction } from 'sequelize';
import { ProjectService } from './project.service';
import { createProjectDto } from 'src/dto/project/create-project.dto';
import { CommonPageDto } from 'src/dto/common-page.dto';

import { AnyFilesInterceptor } from '@nestjs/platform-express';
import multerS3 from 'multer-s3';
import moment from 'moment';
import path from 'path';
import AWS from 'aws-sdk';
import dotenv from "dotenv";
dotenv.config();

@ApiTags('PROJECT API')
@Controller('api/project')
export class ProjectController {

  private ncpAccesskey = process.env['NCP_ACCESS_KEY'];
  private ncpSecretkey = process.env['NCP_SECRET_KEY'];
  private endpoint = process.env['NCP_S3_ENDPOINT'];

  constructor(
    private projectService: ProjectService,
  ) {}

  /*************************************************
   * 프로젝트 조회
   * 
   * @returns  프로젝트 리스트
   ************************************************/
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT')
  @Get('/post')
  @ApiOperation({
    summary: ' 프로젝트 리스트',
    description: ' 프로젝트 리스트',
  })
  @ApiQuery({type : CommonPageDto})
  async getProjectList(@Query() props
                    , @Req() req
                    , @TransactionParam() transaction: Transaction) {
    return this.projectService.getProjectList({props, transaction});
  }

  /*************************************************
   * 관심 키워드 리스트 조회
   * 
   * @returns  관심 키워드 리스트
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/interest')
  @ApiOperation({
    summary: ' 관심 키워드 리스트',
    description: ' 관심 키워드 리스트',
  })
  async getInterestList(@Query() props
                      , @Req() req
                      , @TransactionParam() transaction: Transaction) {
    const member = req.user;                    
    return this.projectService.getInterestList({props, member ,transaction});
  }
  /*************************************************
   * 프로젝트 스크랩 
   * 
   * @param createConsentCoordinateDto
   * @returns 프로젝트 스크랩 
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/scrap/:projectId')
  @ApiOperation({
    summary: '프로젝트 스크랩 ',
    description: '프로젝트 스크랩 ',
  })
  @ApiParam({name:'projectId'})
  async insertScrap(@Body() props, 
                    @Req() req,
                    @Param('projectId') path: any,
                    @TransactionParam() transaction: Transaction,
  ) {
    const member = req.user;
    props['id'] = path;
    return this.projectService.insertScrap({ props , member , transaction });
  }

  /*************************************************
   * 프로젝트 상세
   * 
   * @returns  프로젝트 상세
   ************************************************/
  @Get('/clinical-trial/:id')
  @ApiOperation({
    summary: ' 프로젝트 상세',
    description: ' 프로젝트 상세',
  })
  @ApiParam({name:'id'})
  async getProjectInfo(@Query() props
                    , @Req() req
                    , @Param('id') path: any
                    , @TransactionParam() transaction: Transaction) {
    props['id'] = path;
    return this.projectService.getProjectInfo({props , transaction});
  }

  /*****************[마이페이지]************************/
  /*************************************************
   * 내가 참여신청한 프로젝트 리스트
   * 
   * @returns  내가 참여신청한 프로젝트 리스트
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/apply-list')
  @ApiOperation({
    summary: '내가 참여신청한 프로젝트 리스트 (마이페이지)',
    description: '내가 참여신청한 프로젝트 리스트 (마이페이지)',
  })
  async getMyProjectList(@Query() props
                        ,@Req() req
                        ,@TransactionParam() transaction: Transaction) {
    const member = req.user;
    return this.projectService.getMyProjectList({props, member , transaction});
  }

  /*************************************************
   * 내가 참여 상태
   * 
   * @returns  내가 참여 상태
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/apply-status')
  @ApiOperation({
    summary: '내가 참여 상태',
    description: '내가 참여 상태',
  })
  async getMyApplyStatus(@Query() props
                        ,@Req() req
                        ,@TransactionParam() transaction: Transaction) {
    const member = req.user;
    return this.projectService.getMyApplyStatus({props, member , transaction});
  }




}
