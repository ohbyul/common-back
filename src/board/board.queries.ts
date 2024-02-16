import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { COMMON } from 'src/entitys/common/common.model';

@Injectable()
export class BoardQuery {
  constructor(
    @InjectModel(COMMON)
    private CommonModel: typeof COMMON,
  ) {}

  private aesSecretkey = process.env['AES_SECRETKEY'];
  
  /*************************************************
   * 리스트
   * 
   * @param
   * @returns 
   ************************************************/
  async getBoardList(params: any) {
    let { offset, pageLength
      , whereOptionString, orderOptionString
      , transaction 
    } = params;

    const boardListQuery: any = await this.CommonModel.sequelize.query(
        `
        SELECT * FROM (
            SELECT tb.ID 
                  ,tb.TITLE 
                  ,tb.CONTENTS 
                  ,tb.BBS_KIND_CD 
                  ,tb.WRITE_DTM
                  ,tb.POST_CLASSIFICATION_CD
                  ,tb.WRITE_USER_LOGIN_ID 
                  ,tb.WRITE_MEMBER_LOGIN_ID
                  ,tb.VIEW_COUNT
                  ,tb.DELETE_YN
                  ,tb.UPPER_BBS_ID 
                  ,tb.DISPLAY_YN
                  ,tb.CREATE_DTM 
                  ,tb.CREATE_USER_LOGIN_ID
                  ,tb.CREATE_MEMBER_LOGIN_ID 
                  ,(SELECT IF(COUNT(tbaf.ID)> 0 , 'Y' , 'N') FROM TB_BBS_ATTACHMENT_FILE tbaf WHERE tbaf.BBS_ID = tb.ID AND tbaf.DELETE_YN = 'N') AS FILE_YN
                	,tb2.WRITE_USER_LOGIN_ID AS ANSWER_USER_ID
                	,tb2.WRITE_DTM AS ANSWER_WRITE_DTM
                	,CAST(AES_DECRYPT(UNHEX(tu2.USER_NM), :aesSecretkey, tu2.ENCRYPT_IV) AS CHAR) AS ANSWER_USER_NM
                	,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
                  ,IF(tb2.ID IS NOT NULL, 'Y' , 'N')  AS ANSWER_YN
              FROM TB_BBS tb  
              LEFT JOIN TB_BBS tb2 ON tb.ID = tb2.UPPER_BBS_ID AND tb2.DELETE_YN = 'N' 
              LEFT JOIN TB_USER tu2 ON tu2.LOGIN_ID = tb2.WRITE_USER_LOGIN_ID
              LEFT JOIN TB_MEMBER tm ON tm.LOGIN_ID = tb.WRITE_MEMBER_LOGIN_ID
        ) t10  
          WHERE 1=1
            AND t10.DELETE_YN = 'N'
            AND t10.UPPER_BBS_ID IS NULL
                ${whereOptionString}
                ${orderOptionString}
            LIMIT ${offset}, ${pageLength}
      `,
        { 
          replacements : {
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT ,transaction,
          mapToModel: true
        },
    );

    return boardListQuery;
  }
  
  async getBoardTotalCount(params :any) {
    let { whereOptionString, orderOptionString, optionQuery, optionString, transaction } = params;
    let boardListTotalCount: any = await this.CommonModel.sequelize.query(
        `
        SELECT COUNT(*) as totalCount
        FROM (
            SELECT tb.ID 
                  ,tb.TITLE 
                  ,tb.CONTENTS 
                  ,tb.BBS_KIND_CD 
                  ,tb.WRITE_DTM
                  ,tb.POST_CLASSIFICATION_CD
                  ,tb.WRITE_USER_LOGIN_ID 
                  ,tb.WRITE_MEMBER_LOGIN_ID
                  ,tb.VIEW_COUNT 
                  ,tb.DELETE_YN
                  ,tb.UPPER_BBS_ID 
                  ,tb.DISPLAY_YN
                  ,tb.CREATE_DTM 
                  ,tb.CREATE_USER_LOGIN_ID
                  ,tb.CREATE_MEMBER_LOGIN_ID 
                  ,(SELECT IF(COUNT(tbaf.ID)> 0 , 'Y' , 'N') FROM TB_BBS_ATTACHMENT_FILE tbaf WHERE tbaf.BBS_ID = tb.ID AND tbaf.DELETE_YN = 'N') AS FILE_YN
                  ,tb2.WRITE_USER_LOGIN_ID AS ANSWER_USER_ID
                  ,tb2.WRITE_DTM AS ANSWER_WRITE_DTM
                  ,CAST(AES_DECRYPT(UNHEX(tu2.USER_NM), :aesSecretkey, tu2.ENCRYPT_IV) AS CHAR) AS ANSWER_USER_NM
                  ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
                  ,IF(tb2.ID IS NOT NULL, 'Y' , 'N')  AS ANSWER_YN
            FROM TB_BBS tb  
              LEFT JOIN TB_BBS tb2 ON tb.ID = tb2.UPPER_BBS_ID AND tb2.DELETE_YN = 'N' 
              LEFT JOIN TB_USER tu2 ON tu2.LOGIN_ID = tb2.WRITE_USER_LOGIN_ID
              LEFT JOIN TB_MEMBER tm ON tm.LOGIN_ID = tb.WRITE_MEMBER_LOGIN_ID
              ) t10  
            WHERE 1=1
              AND t10.DELETE_YN = 'N'
              AND t10.UPPER_BBS_ID IS NULL 
              ${whereOptionString}
              ${orderOptionString}
      `,
        { 
          replacements : {
            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT,transaction,
          mapToModel: true 
        },
      );

    return boardListTotalCount[0].totalCount;
  }

  /*************************************************
   * 게시글 상세보기
   * 
   * @param
   * @returns 
   ************************************************/
  async getBoardInfo(params: any) {
    let { props , member, transaction } = params
    let { id , viewCountYn, bbsKindCd } = props;
    
    //[조회수 업데이트]
    if (viewCountYn == 'Y') {
      await this.CommonModel.sequelize.query(
        `
        UPDATE TB_BBS tb
          SET VIEW_COUNT = VIEW_COUNT + 1
        WHERE 1=1
          AND DELETE_YN = 'N'
          AND ID = :id
        `
        ,
        {
          replacements: {
            id: id
          },
          type: QueryTypes.UPDATE , transaction
        },
      );
    }

    const boardInfoQuery: any = await this.CommonModel.sequelize.query(
        `
          SELECT tb.ID 
                ,tb.TITLE 
                ,tb.CONTENTS 
                ,tb.BBS_KIND_CD 
                ,tb.WRITE_DTM 
                ,tb.POST_CLASSIFICATION_CD
                ,tb.WRITE_USER_LOGIN_ID
                ,tb.WRITE_MEMBER_LOGIN_ID
                ,tb.VIEW_COUNT 
                ,tb.DELETE_YN
                ,tb.DISPLAY_YN 
                ,tb.CREATE_DTM 
                ,tb.CREATE_USER_LOGIN_ID
                ,tb.CREATE_MEMBER_LOGIN_ID
                ,tb.MODIFY_USER_LOGIN_ID
                ,tb.MODIFY_USER_DTM
                ,(SELECT IF(COUNT(tbaf.ID)> 0 , 'Y' , 'N') FROM TB_BBS_ATTACHMENT_FILE tbaf WHERE tbaf.BBS_ID = tb.ID AND tbaf.DELETE_YN = 'N') AS FILE_YN
                ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
                ,CAST(AES_DECRYPT(UNHEX(tu.MOBILE_NO), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_MOBILE_NO
                ,CAST(AES_DECRYPT(UNHEX(tm.MEMBER_NM), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_NM
                ,CAST(AES_DECRYPT(UNHEX(tm.MOBILE_NO), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_MOBILE_NO
                ,CAST(AES_DECRYPT(UNHEX(tm.EMAIL), :aesSecretkey, tm.ENCRYPT_IV) AS CHAR) AS MEMBER_EMAIL
                ,(SELECT IF(COUNT(tb2.ID) > 0 , 'Y' , 'N') 
                  FROM TB_BBS tb2  
                  WHERE tb2.DELETE_YN = 'N' 
                  AND tb2.BBS_KIND_CD = :bbsKindCd
                  AND tb2.UPPER_BBS_ID = tb.ID
                ) AS ANSWER_YN
            FROM TB_BBS tb  
            LEFT JOIN TB_USER tu ON tu.LOGIN_ID = tb.WRITE_USER_LOGIN_ID
            LEFT JOIN TB_MEMBER tm ON tm.LOGIN_ID = tb.WRITE_MEMBER_LOGIN_ID
            WHERE 1=1
              AND tb.DELETE_YN = 'N'
              AND tb.ID = :id
      `,
        { 
          replacements: {
            id,
            bbsKindCd,

            aesSecretkey:this.aesSecretkey,
          },
          type: QueryTypes.SELECT ,transaction,
          mapToModel: true
        },
    );

    return boardInfoQuery[0];
  }

  /*************************************************
   * 게시글 상세보기 (답변)
   * 
   * @param
   * @returns 
   ************************************************/
  async getBoardCommentInfo(params: any) {
    let { props , member, transaction } = params
    let { id , viewCountYn, bbsKindCd } = props;
    const boardCommentQuery: any = await this.CommonModel.sequelize.query(
      `
      SELECT tb.ID 
                ,tb.TITLE 
                ,tb.CONTENTS 
                ,tb.BBS_KIND_CD 
                ,tb.WRITE_DTM 
                ,tb.POST_CLASSIFICATION_CD
                ,CAST(AES_DECRYPT(UNHEX(tu.USER_NM), :aesSecretkey, tu.ENCRYPT_IV) AS CHAR) AS USER_NM 
                ,tb.WRITE_USER_LOGIN_ID 
                ,tb.VIEW_COUNT 
                ,tb.DELETE_YN
                ,tb.DISPLAY_YN 
                ,tb.CREATE_DTM 
                ,tb.CREATE_USER_LOGIN_ID
                ,tb.CREATE_MEMBER_LOGIN_ID
                ,tb.MODIFY_USER_LOGIN_ID
                ,tb.MODIFY_USER_DTM
                ,(SELECT IF(COUNT(tbaf.ID)> 0 , 'Y' , 'N') FROM TB_BBS_ATTACHMENT_FILE tbaf WHERE tbaf.BBS_ID = tb.ID AND tbaf.DELETE_YN = 'N') AS FILE_YN
                ,(SELECT IF(COUNT(tb2.ID) > 0 , 'Y' , 'N') 
                  FROM TB_BBS tb2  
                  WHERE tb2.DELETE_YN = 'N' 
                  AND tb2.BBS_KIND_CD = :bbsKindCd
                  AND tb2.UPPER_BBS_ID = tb.ID
                ) AS ANSWER_YN
                ,tu.ORGANIZATION_CD AS ANSWER_ORGANIZATION_CD
                ,tz.ORGANIZATION_NM AS ANSWER_ORGANIZATION_NM
        FROM TB_BBS tb  
        LEFT JOIN TB_USER tu ON tu.LOGIN_ID = tb.WRITE_USER_LOGIN_ID
        INNER JOIN TB_ORGANIZATION tz ON tz.ORGANIZATION_CD = tu.ORGANIZATION_CD
      WHERE 1=1
        AND tb.DELETE_YN = 'N'
        AND tb.UPPER_BBS_ID = :id
      `
      ,
      { 
        replacements: {
          id,
          bbsKindCd,

          aesSecretkey:this.aesSecretkey,
        },
        type: QueryTypes.SELECT ,transaction,
        mapToModel: true
      },
    );

    return boardCommentQuery;
  }
  /*************************************************
   * 게시글 상세보기(파일 전체)
   * 
   * @param
   * @returns 
   ************************************************/
  async getBoardInfoFiles(params: any){
    let { props , member, transaction } = params
    let { id , viewCountYn, bbsKindCd } = props;
    const boardInfoFilesQuery: any = await this.CommonModel.sequelize.query(
      `
      SELECT ID
            ,BBS_ID
            ,ORIGINAL_FILE_NM
            ,SAVE_FILE_NM
            ,EXTENSION_NM
            ,FILE_PATH
            ,DELETE_YN
            ,CREATE_MEMBER_LOGIN_ID
            ,CREATE_USER_LOGIN_ID
            ,CREATE_DTM
            ,MODIFY_MEMBER_LOGIN_ID
            ,MODIFY_USER_LOGIN_ID
            ,MODIFY_MEMBER_DTM
            ,MODIFY_USER_DTM
            ,FILE_SIZE
        FROM TB_BBS_ATTACHMENT_FILE tbaf 
      WHERE tbaf.BBS_ID = :id 
        AND DELETE_YN = 'N'
      `,
      { 
        replacements: {
          id: id,
        },
        type: QueryTypes.SELECT ,transaction,
        mapToModel: true
      },
    );
    return boardInfoFilesQuery;
  }

  /*************************************************
   * 상세보기(파일 단일)
   * 
   * @param
   * @returns 
   ************************************************/
  async getBoardInfoFile(params: any){
    let { props , transaction } = params;
    let { fileId } = props;
    const boardFileQuery: any = await this.CommonModel.sequelize.query(
      `
      SELECT ID
            ,BBS_ID
            ,ORIGINAL_FILE_NM
            ,SAVE_FILE_NM
            ,EXTENSION_NM
            ,FILE_PATH
            ,DELETE_YN
            ,CREATE_MEMBER_LOGIN_ID
            ,CREATE_USER_LOGIN_ID
            ,CREATE_DTM
            ,MODIFY_MEMBER_LOGIN_ID
            ,MODIFY_USER_LOGIN_ID
            ,MODIFY_MEMBER_DTM
            ,MODIFY_USER_DTM
            ,FILE_SIZE
        FROM TB_BBS_ATTACHMENT_FILE tbaf 
      WHERE tbaf.ID = :fileId 
        AND DELETE_YN = 'N'
      `,
      { 
        replacements: {
          fileId: fileId,
        },
        type: QueryTypes.SELECT ,transaction,
        mapToModel: true
      },
    );
    return boardFileQuery[0];
  }

  /*************************************************
   * 게시글 등록
   * 
   * @param
   * @returns 
   ************************************************/
  async insertBoard(params: any) {
    let { props, member, transaction } = params;
    let { displayYn, title, contents, bbsKindCd, postClassificationCd , upperBbsId, protocolNo } = props;
    let { memberId } = member

    //[게시글 등록]
    let result : any = await this.CommonModel.sequelize.query(
      `
        INSERT INTO TB_BBS(
            BBS_KIND_CD
            ,POST_CLASSIFICATION_CD
            ,TITLE
            ,CONTENTS
            ,WRITE_MEMBER_LOGIN_ID
            ,WRITE_USER_LOGIN_ID
            ,WRITE_DTM
            ,UPPER_BBS_ID
            ,VIEW_COUNT
            ,PROTOCOL_NO
            ,DISPLAY_YN
            ,DELETE_YN
            ,MODIFY_MEMBER_LOGIN_ID
            ,MODIFY_MEMBER_DTM
            ,CREATE_MEMBER_LOGIN_ID
            ,CREATE_DTM
            )
      VALUES(
            :bbsKindCd
            ,:postClassificationCd
            ,:title
            ,:contents
            ,:memberId
            ,null
            ,now()
            ,:upperBbsId
            ,0
            ,:protocolNo
            ,:displayYn
            ,'N'
            ,:memberId
            ,now()
            ,:memberId
            ,now()
          )
      `,
      {
        replacements: {
          bbsKindCd: bbsKindCd,
          title: title ?? null,
          contents: contents,
          displayYn: displayYn ?? 'Y',
          postClassificationCd: postClassificationCd ?? null,
          upperBbsId: upperBbsId ?? null,
          memberId: memberId,
          protocolNo: protocolNo ?? null,
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
      },
    );

    return result[0];
  }
  /*************************************************
   * 파일등록
   * 
   * @param
   * @returns 
   ************************************************/
  async insertBoardFile(params : any) {
    let { props, member, transaction, id } = params;
    let { originalFileNm, saveFileNm, extensionNm, filePath, fileSize } = props;
    let { memberId } = member

    //파일등록
    let result : any = await this.CommonModel.sequelize.query(
      `
      INSERT INTO TB_BBS_ATTACHMENT_FILE (
            BBS_ID
            ,ORIGINAL_FILE_NM
            ,SAVE_FILE_NM
            ,EXTENSION_NM
            ,FILE_PATH
            ,DELETE_YN
            ,CREATE_MEMBER_LOGIN_ID
            ,CREATE_DTM
            ,MODIFY_MEMBER_LOGIN_ID
            ,MODIFY_MEMBER_DTM
            ,FILE_SIZE
            )
      VALUES(
          :id
          ,:originalFileNm
          ,:saveFileNm
          ,:extensionNm
          ,:filePath
          ,'N'
          ,:memberId
          ,now()
          ,:memberId
          ,now()
          ,:fileSize
          )
      `,
      {
        replacements: {
          id: id,
          originalFileNm: originalFileNm,
          saveFileNm: saveFileNm,
          extensionNm: extensionNm,
          filePath: filePath,
          memberId: memberId,
          fileSize: fileSize,
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
      },
    );

    return result[0];
  }

  /*************************************************
   * 게시판 수정
   * 
   * @param
   * @returns 
   ************************************************/
  async updateBoard(params: any) {
    let { props, member, updateData, transaction } = params;
    let displayYn, title, contents, id, postClassificationCd;
    if (props.length > 0) {
      displayYn = updateData.displayYn
      title = updateData.title
      contents = updateData.contents
      id = updateData.id
    } else {
      displayYn = props.displayYn
      postClassificationCd = props.postClassificationCd
      title = props.title
      contents = props.contents
      id = props.id
    }
    let { memberId } = member

    //[게시판 수정]
    await this.CommonModel.sequelize.query(
      `
        UPDATE TB_BBS
          SET TITLE =:title
            ,CONTENTS =:contents
            ,DISPLAY_YN =:displayYn
            ,POST_CLASSIFICATION_CD = :postClassificationCd
            ,MODIFY_MEMBER_LOGIN_ID =:memberId
            ,MODIFY_MEMBER_DTM =now()
          WHERE ID = :id
      `,
      {
        replacements: {
          title: title ?? null,
          contents: contents,
          displayYn: displayYn ?? 'Y',
          memberId: memberId,
          postClassificationCd: postClassificationCd ?? null,
          id: id,
        },
        type: QueryTypes.INSERT, transaction,
        mapToModel: true,
      },
    );
  }
   /*************************************************
   * 게시글 삭제
   * -> 
   * 
   * @param 
   * @returns 
   ************************************************/
   async deleteBoard(params: any) {
    let { props, member, transaction} = params;
    let { id } = props
    let { memberId } = member

    await this.CommonModel.sequelize.query (
      `
      UPDATE TB_BBS
         SET DELETE_YN = 'Y'
            ,MODIFY_MEMBER_LOGIN_ID = :memberId
            ,MODIFY_MEMBER_DTM = now()
       WHERE ID = :id OR UPPER_BBS_ID = :id
      `
      ,
      {
        replacements: {
          memberId: memberId,
          id: id
        },
        type: QueryTypes.UPDATE,
        transaction,
        mapToModel: true
      },
    );

  }

  /*************************************************
   * 게시판 파일 삭제
   * -> 
   * 
   * @param 
   * @returns 
   ************************************************/
  async deleteBoardFile(params: any) {
    let { props , member ,transaction } = params;
    let { fileId } = props  
    let { memberId } = member;

    await this.CommonModel.sequelize.query(
      `
      UPDATE TB_BBS_ATTACHMENT_FILE
         SET DELETE_YN = 'Y'
            ,MODIFY_MEMBER_LOGIN_ID = :memberId
            ,MODIFY_MEMBER_DTM = now()
       WHERE ID = :fileId
      `
      ,
      {
        replacements: {
          memberId: memberId,
          fileId: fileId,
        },
        type: QueryTypes.UPDATE ,transaction,
        mapToModel: true
      },
    )

  }


  
    /*************************************************
   * 게시판 상세보기(파일 전체)
   * 
   * @param
   * @returns 
   ************************************************/
    async getBoardAllFiles(params: any){
      let { props, transaction } = params;
      let { fileId } = props;
      const boardInfoFilesQuery: any = await this.CommonModel.sequelize.query(
        `
        SELECT ID
              ,BBS_ID
              ,ORIGINAL_FILE_NM
              ,SAVE_FILE_NM
              ,EXTENSION_NM
              ,FILE_PATH
              ,DELETE_YN
              ,CREATE_MEMBER_LOGIN_ID
              ,CREATE_USER_LOGIN_ID
              ,CREATE_DTM
              ,MODIFY_MEMBER_LOGIN_ID
              ,MODIFY_USER_LOGIN_ID
              ,MODIFY_MEMBER_DTM
              ,MODIFY_USER_DTM
              ,FILE_SIZE
          FROM TB_BBS_ATTACHMENT_FILE tbaf 
          WHERE tbaf.BBS_ID = :id 
          AND DELETE_YN = 'N'
        `,
        { 
          replacements: {
            id: fileId,
          },
          type: QueryTypes.SELECT ,transaction,
          mapToModel: true
        },
      );
      return boardInfoFilesQuery;
    }
}
