import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    Param,
    Delete,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    Query
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { ProjectBoardService } from './projectboard.service';
import { TransactionParam } from 'src/decorator/transaction.deco';
import { Transaction } from 'sequelize';
import { CommonPageDto } from 'src/dto/common-page.dto';
import { OrderOptionDto } from 'src/dto/order-option.dto';
import { WhereOptionDto } from 'src/dto/where-option.dto.';
import { BoardDto } from 'src/dto/board/board.dto';
import multerS3 from 'multer-s3';
import moment from 'moment';
import path from 'path';
import AWS from 'aws-sdk';
import dotenv from "dotenv";
dotenv.config();

@ApiTags('PROJECTBOARD API')
@Controller('/api/projectboard')
export class ProjectBoardController {
    constructor(private projectBoardService: ProjectBoardService) {}

    /*************************************************
    * 마이페이지 - 내문의리스트
    * 
    * @param 
    * @returns  마이페이지 - 내문의리스트 
    ************************************************/
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @Get('/:bbsKindCd')
    @ApiOperation({
        summary: '프로젝트 문의 리스트',
        description: '프로젝트 문의 리스트',
    })
    @ApiQuery({ type: CommonPageDto})
    async getProjectBoardList( @Query() props
                            ,@Req() req
                            ,@TransactionParam() transaction: Transaction) {
        const member = req.user;
        return this.projectBoardService.getProjectBoardList({ props, member, transaction});
    }

    /*************************************************
    * 게시글 상세보기
    * -> 
    * 
    * @param 
    * @returns 게시글 상세보기
    ************************************************/
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @Get('/:bbsKindCd/info/:id')
    @ApiOperation({
        summary: '게시글 상세',
        description: '게시글 상세',
    })
    @ApiParam({name:'id'})
    @ApiParam({name:'bbsKindCd'})
    async getProjectBoardInfo( @Query() props
                                                ,@Param('bbsKindCd') bbsKindCd: any
                                                ,@Param('id') path: any
                                                ,@Req() req
                                                ,@TransactionParam() transaction: Transaction ){
        const member = req.user;
        props['id'] = path;
        props['bbsKindCd'] = bbsKindCd;
        return this.projectBoardService.getProjectBoardInfo({ props, member, transaction});
    }


    /*************************************************
    * 게시글 등록
    * -> 
    * 
    * @param 
    * @returns 게시글 등록 성공여부
    ************************************************/
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @Post('/:bbsKindCd')
    @ApiOperation({
        summary: '게시글 등록',
        description: '게시글 등록 ',
    })
    @UseInterceptors(FilesInterceptor('files'))
    @ApiBody({ type: BoardDto })
    @ApiParam({ name: 'id' })
    @ApiParam({ name: 'bbsKindCd' })
    async insertBoard(@Body() props 
                        ,@Param('bbsKindCd') bbsKindCd: any
                        ,@Param('id') path: any
                        ,@Req() req 
                        ,@TransactionParam() transaction: Transaction
                        ,@UploadedFiles() files: Array<Express.Multer.File>
    ) {
        const member = req.user;
        props = JSON.parse(props.body)
        props['id'] = path;
        props['bbsKindCd'] = bbsKindCd;
        props['files'] = files
        return this.projectBoardService.insertBoard({ props, member, transaction})
    }

    /*************************************************
    * 게시글 수정
    * -> 
    * 
    * @param 
    * @returns 게시글 수정 
    ************************************************/
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @Put('/:bbsKindCd/:id')
    @ApiOperation({
        summary: '게시글 수정',
        description: '게시글 수정 ',
    })
    @UseInterceptors(FilesInterceptor('files'))
    @ApiBody({ type: BoardDto })
    async updateBoard(@Body() props 
                                    ,@Req() req 
                                    ,@TransactionParam() transaction: Transaction
                                    ,@UploadedFiles() files: Array<Express.Multer.File>
    ){
        const member = req.user;
        props = JSON.parse(props.body)
        props['files'] = files
        return this.projectBoardService.updateBoard({ props, member, transaction})
    }

    /*************************************************
    * 게시글 삭제 
    * 
    * @param 
    * @returns 게시글 삭제
    ************************************************/
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @Delete('/:id')
    @ApiOperation({
        summary: '게시글 삭제 API',
        description: '게시글 삭제 API',
    })
    @ApiQuery({type: BoardDto})
    async deleteBoard(  @Query() props
                                    ,@Req() req
                                    ,@Param('id') path: any
                                    ,@TransactionParam() transaction: Transaction
    ) {
        const member = req.user;
        props['id'] = path;
        return this.projectBoardService.deleteBoard({ props, member, transaction})
    }

}