import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { ConsentQuery } from './consent.queries';
@Injectable()
export class ConsentService {
  constructor(
    private consentQuery: ConsentQuery,
  ) {}

  /*************************************************
   * 서명동의서 다운로드시, 이력 생성
   * 
   * @returns  서명동의서 다운로드시, 이력 생성
   ************************************************/
  async insertConsentDownloadHistory(params : any) {
    let { props , member , transaction } = params;
    
    let history : any = await this.consentQuery.insertConsentDownloadHistory({...params});
    if (history) {
      return {
        statusCode: 10000,
        message: '정상적으로 내역이 저장되었습니다.',
      };
    } else {
      throw new InternalServerErrorException({
        statusCode: 10002,
      })
    }
  }

}
