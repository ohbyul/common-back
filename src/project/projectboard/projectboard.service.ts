import { Injectable,InternalServerErrorException } from '@nestjs/common';
import { ProjectBoardQuery } from './projectboard.queries';
import AWS from 'aws-sdk';
import { CloudApi } from 'src/lib/cloud-api';

@Injectable()
export class ProjectBoardService {
	private ncpAccesskey = process.env['NCP_ACCESS_KEY'];
	private ncpSecretKey = process.env['NCP_SECRET_KEY'];
	private endPoint = process.env['NCP_S3_ENDPOINT'];
	private ncpBucket = process.env['NCP_BUCKET'];
  private ncpRegion = process.env['NCP_REGION'];
  private filePath = "bbs-attachment-file";

	constructor(
		private projectBoardQuery: ProjectBoardQuery,
    private cloudApi: CloudApi
	) {}

  /*************************************************
  * 게시판 리스트
  * 
  * @param
  * @returns 
  ************************************************/
  async getProjectBoardList(params: any) {
    let { props , member, transaction } = params
    let { page, pageLength, whereOptions, orderOptions, bbsKindCd } = props;
    page = page === 0 ? 1 : page;
    const offset = (page - 1) * pageLength;

    /** ORDER OPTION */
    let orderOptionString = '';
    if (orderOptions != undefined) {
      const orderOptionArr = orderOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        return items.column_name + ' ' + items.orderOption.toString();
      });

      if (orderOptionArr.length > 0) {
        orderOptionString = ' ORDER BY ' + orderOptionArr.join(', ') ;
      }
    } else {
      orderOptionString = 'ORDER BY t10.WRITE_DTM DESC';
    }

    /* WHERE OPTION */
    let whereOptionString = '';
    let whereOptionArr = [];
    if (whereOptions != undefined) {
      whereOptionArr = whereOptions.map((strItems) => {
        let items = JSON.parse(strItems);
        const whereValue = items.where_value.toString()

        // like %%
        if(items.where_type === 'like'){

          if (items.where_key == 'ALL') {
            return `(t10.TITLE like '%${whereValue}%' OR t10.CONTENTS like '%${whereValue}%')`
          }
          else{
            return `t10.${items.where_key} like '%${whereValue}%'`;
          }
        }

        //  =
        else
        if(items.where_type === 'equal'){ 
          return `t10.${items.where_key} = '${whereValue}'`;
        }

      });
    }

    // 마이페이지 - 내문의내역
    if (member) {
      let {memberId} = member
      let memberWrite = `t10.WRITE_MEMBER_LOGIN_ID = '${memberId}'`;
      whereOptionArr.push(memberWrite)
    }

    if (whereOptionArr.length > 0) {
      whereOptionString = ' AND ' + whereOptionArr.join(' AND ');
    } else {
      whereOptionString = ' ';
    }
    
    // [1] 리스트 
    let boardListQuery :any = await this.projectBoardQuery.getProjectBoardList({
      ...params
      , offset, pageLength, member
      , whereOptionString, orderOptionString
    });
    
    //[2] 리스트 토탈 카운트
    let boardListTotalCount :any = await this.projectBoardQuery.getTotalCount({
      ...params
      , offset, pageLength, member
      , whereOptionString, orderOptionString
    });
    
    
    if (boardListQuery.length > 0) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: boardListQuery,
        totalCount: boardListTotalCount
      };
    } else {
      return {
        statusCode: 10000,
        message: '게시글이 없습니다.',
        data: [],
        totalCount: 0
      };
    }
  }

  /*************************************************
  * 게시글 상세
  * 
  * @param
  * @returns 
  ************************************************/
  async getProjectBoardInfo(params: any) {
    let { props , member, transaction } = params
    let { id , viewCountYn, bbsKindCd } = props;


    // [1] 상세 Info
    let boardInfo :any = await this.projectBoardQuery.getProjectBoardInfo({...params});

    // [2] 상세 Comment Info
    let boardCommentQuery :any = await this.projectBoardQuery.getProjectBoardCommentInfo({...params})
    boardInfo['boardCommentInfo'] = boardCommentQuery ? boardCommentQuery : {}

    // [2] 파일
    let boardFileQuery :any = await this.projectBoardQuery.getProjectBoardInfoFiles({...params})
    boardInfo['boardFile'] = boardFileQuery

    if (boardInfo) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: boardInfo,
      };
    } else {
      return {
        statusCode: 10002,
        message: '실패',
        data: [],
      };
    }
  }

  /*************************************************
  * 게시글 등록
  * 
  * @param 
  * @returns 게시글 등록 성공여부
  ************************************************/
  async insertBoard(params: any) {
    let { props, member, transaction} = params;
    let { files } = props
    let id :any = await this.projectBoardQuery.insertBoard({...params})

    if(files.length > 0) {
      for(let file of files) {

        await this.cloudApi.upload(this.filePath, file)

        let createData = {
          originalFileNm:file.info.originalFileName,
          saveFileNm : file.info.saveFileName,
          extensionNm : file.info.fileExtension,
          filePath : this.filePath,
          fileSize: file.info.fileSize,
        }
        await this.projectBoardQuery.insertBoardFile({
          ...params,
          id,
          props: createData
        })
      }
    }
    
    if (id) {
      return {
        statusCode: 10000,
        message: '게시글 등록이 정상적으로 되었습니다.',
        data: id,
      };
    } else {
      return {
        statusCode: 10002,
        message: '실패',
        data: [],
      };
    }
  }

  /*************************************************
  * 게시글 수정
  * 
  * @param 
  * @returns 게시글 수정 성공여부
  ************************************************/
  async updateBoard(params: any) {
    let { props, member, transaction} = params;
    let { files , id, deleteFiles} = props

    await this.projectBoardQuery.updateBoard({
      ...params,
      member
    })
    
    if (files?.length > 0) {
      for(let file of files) {

        await this.cloudApi.upload(this.filePath, file)

        let createData = {
          originalFileNm:file.info.originalFileName,
          saveFileNm : file.info.saveFileName,
          extensionNm : file.info.fileExtension,
          filePath : this.filePath,
          fileSize: file.info.fileSize,
        }

        await this.projectBoardQuery.insertBoardFile({
          ...params,
          id,
          props: createData
        })
      }
    }

    if (deleteFiles?.length > 0) {
      for(let deleteFile of deleteFiles) {
        props['fileId'] = deleteFile
        //삭제할 파일 정보
        let boardFileList : any = await this.projectBoardQuery.getProjectBoardInfoFile({...params})
        //DB 삭제 
        await this.projectBoardQuery.deleteBoardFile({...params})
        if(boardFileList){
          //[3] aws 파일 삭제 
          await this.cloudApi.deleteObject(boardFileList.FILE_PATH, boardFileList.SAVE_FILE_NM)
        }
      }
    }
    
    return {
      statusCode: 10000,
      message: '게시글 수정이 정상적으로 되었습니다.',
    };
  }

  /*************************************************
   * 게시글 수정
   * 
   * 
   * @param 
   * @returns 게시글 수정 성공여부
   ************************************************/
   async updateDisplayBoard(params: any) {
    let { props, user, transaction} = params;
    if (props.length > 0) {
      for(let updateParams of props) {
          let updateData = {
            id: updateParams.id,
            title: updateParams.title,
            contents: updateParams.contents,
            displayYn: updateParams.displayYn
          }
          await this.projectBoardQuery.updateBoard({
            ...params,
            updateData,
            user,
            transaction
          })
      }
      return {
        statusCode: 10000,
        message: '게시글 수정이 정상적으로 되었습니다.',
      };
    }

  }
  /*************************************************
   * 게시글 삭제
   * 
   * @param 
   * @returns 게시글 삭제 여부
   ************************************************/
  async deleteBoard(params: any) {
    await this.projectBoardQuery.deleteBoard({
      ...params
    })
    await this.deleteBoardFiles(params);
    return {
      statusCode: 10000,
      message: '게시글이 정상적으로 삭제되었습니다.',
    };
  }

  /*************************************************
   * 게시글 파일 삭제 (전체)
   * 
   * @param 
   * @returns 게시글 파일 삭제 여부
   ************************************************/
  async deleteBoardFiles(params: any) {
    let { props, member, transaction } = params
    let { id } = props

    //[1] 삭제할 파일 정보
    let boardFileList : any = await this.projectBoardQuery.getProjectBoardInfoFiles({
      ...params,
      id
    })

    //[2] DB 삭제 
    for(let file of boardFileList){
      props['fileId'] = file.ID
      await this.projectBoardQuery.deleteBoardFile({...params})

      //[3] aws 파일 삭제 
      this.cloudApi.deleteObject(file.FILE_PATH, file.SAVE_FILE_NM)

    }

    return {
      statusCode: 10000,
      message: '파일 삭제를 성공하였습니다.',
    }
  }

   }
