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
    UseInterceptors,
    UploadedFiles,
    Query
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
  import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
  import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
  
  import { BoardService } from './board.service';
  
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
  

@ApiTags('BOARD API')
@Controller('/api/board')
export class BoardController {
  constructor(private boardService: BoardService) {}

  /*************************************************
   * 게시글 리스트
   * 
   * @param 
   * @returns 게시글 리스트 
   ************************************************/
  @Get('/public/:bbsKindCd')
  @ApiOperation({
    summary: '게시글 리스트',
    description: '게시글 리스트',
  })
  @ApiQuery({ type: CommonPageDto})
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'bbsKindCd' })
  async getBoardList(
                      @Query() props
                      ,@Param('bbsKindCd') bbsKindCd: any
                      ,@Param('id') path: any
                      ,@Req() req
                      ,@TransactionParam() transaction: Transaction ){
    const member = req.user;
    props['id'] = path;   //프로젝트 아이디
    props['bbsKindCd'] = bbsKindCd;
    return this.boardService.getBoardList({ props, member, transaction}); 
  }

  /*************************************************
   * 게시글 상세보기
   * 
   * @param 
   * @returns 게시글 상세보기
   ************************************************/
  @Get('/public/:bbsKindCd/:id')
  @ApiOperation({
    summary: '게시글 상세',
    description: '게시글 상세',
  })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'bbsKindCd' })
  async getBoardInfo( @Query() props
                                   ,@Param('bbsKindCd') bbsKindCd: any
                                   ,@Param('id') path: any
                                   ,@Req() req
                                   ,@TransactionParam() transaction: Transaction ){
    const member = req.user;
    props['id'] = path;
    props['bbsKindCd'] = bbsKindCd;                                    
    return this.boardService.getBoardInfo({ props,member, transaction});
  }


  /*************************************************
   * 게시글 등록
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
  async insertBoard( @Body() props 
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
    return this.boardService.insertBoard({ props, member, transaction})
  }


  /*************************************************
   * 에디터 이미지 s3업로드 , 이미지 url 가져오기
   * 
   * @param 
   * @returns 이미지 url
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('/editor/image')
  @ApiOperation({
    summary: '게시글 등록',
    description: '게시글 등록 ',
  })
  @UseInterceptors(FilesInterceptor('file'))  // acl : 'public-read'
  async uploadEditorImage(@Body() props 
                        , @Req() req 
                        , @TransactionParam() transaction: Transaction
                        , @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    props['files'] = files
    return this.boardService.uploadEditorImage({ props, transaction})
  }

  /*************************************************
   * 게시글 수정
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
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'bbsKindCd' })  
  async updateBoard(@Body() props 
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
    return this.boardService.updateBoard({ props, member, transaction})
  }

  /*************************************************
   * 게시글 삭제 
   * -> 
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
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'bbsKindCd' })  
  async deleteBoard(@Query() props
                                ,@Param('bbsKindCd') bbsKindCd: any
                                ,@Param('id') path: any  
                                ,@Req() req
                                ,@TransactionParam() transaction: Transaction
  ) {
    const member = req.user;
    props['id'] = path;
    props['bbsKindCd'] = bbsKindCd;
    return this.boardService.deleteBoard({ props, member, transaction})
  }

  /*************************************************
   * 마이페이지 - 내문의리스트
   * 
   * @param 
   * @returns  마이페이지 - 내문의리스트 
   ************************************************/
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('/auth/:bbsKindCd')
  @ApiOperation({
    summary: '프로젝트 문의 리스트',
    description: '프로젝트 문의 리스트',
  })
  @ApiQuery({ type: CommonPageDto})
  async getAuthBoardList( @Query() props
                                          ,@Req() req
                                          ,@TransactionParam() transaction: Transaction) {
    const member = req.user;
    return this.boardService.getBoardList({ props, member, transaction});
  }

  
}