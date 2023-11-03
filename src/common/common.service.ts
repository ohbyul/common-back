import { Injectable, UnauthorizedException,InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { CommonQuery } from './common.queries';
import { SMSSender } from 'src/lib/sms-sender';
import { EmailSender } from 'src/lib/email-sender';
import { BoardQuery } from 'src/board/board.queries';
import { Crypto } from 'src/lib/crypto';

import Admin_zip from 'adm-zip';
import fetch from 'node-fetch';
import { CloudApi } from 'src/lib/cloud-api';
import fs from 'fs';
import { ReadStream, readFileSync } from 'fs';
import { Stream } from 'stream';

@Injectable()
export class CommonService {
  constructor(
    private commonQuery: CommonQuery,
    private SMSSender: SMSSender,
    private emailSender: EmailSender,
    private boardQuery: BoardQuery,
    private crypto: Crypto,
    private cloudApi: CloudApi,
  ) {}

  /*************************************************
   * 그룹CD별 코드 리스트 조회   
   * 
   * @returns 그룹CD별 코드 리스트
   ************************************************/
  async getCommonCodeList(params : any) {
    let commonCodeList: any = await this.commonQuery.getCommonCodeList({...params});

    if (commonCodeList) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: commonCodeList
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }
  /*************************************************
   * 그룹CD & 상위공통 코드별 리스트 조회   
   * 
   * @returns 그룹CD & 상위공통 코드별  코드 리스트
   ************************************************/
  async getCommonUpperCodeList(params : any) {
    let commonUpperCodeList: any = await this.commonQuery.getCommonUpperCodeList({...params});

    if (commonUpperCodeList) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: commonUpperCodeList
      };
    } else {
      return {
        statusCode: 10002,
        message: '실패'
      }
    }
  }
  /*************************************************
   * SMS 발송
   * 
   * @returns 성공실패
   ************************************************/
  async sendSMS(params : any) {

    let receiveData = await this.SMSSender.sendSMS(params.props);

    if (receiveData) {
      return {
        statusCode: 10000,
        message: '정상적으로 발송되었습니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * EMAIL 발송
   * 
   * @returns 성공실패
   ************************************************/
  async sendEmail(params : any) {

    let receiveData = await this.emailSender.sendEmail(params.props);

    if (receiveData) {
      return {
        statusCode: 10000,
        message: '정상적으로 발송되었습니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * 메세지 발송 템플릿 조회
   * 
   * @returns 성공실패
   ************************************************/
  async getMSGTemplates(params : any) {

    let msgTemplateData = await this.commonQuery.getMSGTemplates({...params});

    if (msgTemplateData) {
      return msgTemplateData;
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  /*************************************************
   * 공개포탈 약관
   * 
   * @param 
   * @returns 공개포탈 약관 정보
   ************************************************/
  async getTerms(params: any) {
    let terms: any = await this.commonQuery.getTerms({...params});

    if (terms) {
      return {
        statusCode: 10000,
        message: '정상적으로 조회되었습니다.',
        data: terms
      };
    } else {
      return {
        statusCode: 10002,
        message: '실패'
      }
    }
  }


    /*************************************************
  * 공지사항 *첨부파일* 다운로드 -ALL
  * 
  * @param
  * @returns 
  ************************************************/
    async downloadFileAll(params: any) {
      let { props , transaction } = params;
      let { encryptoId } = props
  
      //[0] 암호화된 board Id 디코드
      let decrypt = await this.crypto.getDecrypto(encryptoId)
      const id = String(decrypt.id);
      
      //[1] 해당 borad 의 파일 조회
      props['fileId']=id
      let fileList: any = await this.boardQuery.getBoardAllFiles({...params});
  
      //[2] 압축파일
      let fileZip: any = await this.zipFileDownload({fileList});
      return fileZip;
    }
    
  /*************************************************
   * 공통 사용 - zip파일 다운로드
   * 
   * @param
   * @returns 
   ************************************************/
  async zipFileDownload(params: any) {
    let { fileList } = params;

    try {
      let zipName = 'files.zip';
      let zip = new Admin_zip();
    
      for (let [i, data] of fileList.entries()) {
        const filePath = data.FILE_PATH.slice(data.FILE_PATH.lastIndexOf('/') + 1)
        /*****[url]*****/
        // const fileUrl = `${endpoint}/${filePath}/${data.SAVE_FILE_NM}`
        // let stream: any = await fetch(fileUrl);
        // const arrayBuffer = await stream.arrayBuffer();
        // const buffer = Buffer.from(arrayBuffer);

        /*****[s3]*****/
        let props = {
          path : filePath,
          fileName : data.SAVE_FILE_NM,
        }

        let stream: any = await this.cloudApi.getS3DataStream({props})
        const arrayBuffer = await this.stream2buffer(stream)
        const buffer = Buffer.from(arrayBuffer)

        zip.addFile(`${data.ORIGINAL_FILE_NM}`, buffer);
      }
      let zipBuffer = zip.toBuffer();

      return {
        statusCode: 10000,
        message: '정상적으로 다운로드됩니다.',
        zipBuffer,
        zipName: zipName,
      };
    } catch (exception) {
      console.log('zipFileDownload Error : ', exception);
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

  async stream2buffer(stream: Stream): Promise<Buffer> {

    return new Promise < Buffer > ((resolve, reject) => {
        
        const _buf = Array < any > ();

        stream.on("data", chunk => _buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", err => reject(`error converting stream - ${err}`));

    });
  } 

} 

