import { Injectable, UnauthorizedException,InternalServerErrorException } from '@nestjs/common';
import { ParticipantQuery } from './participant.queries';
import { ProjectQuery } from '../project/project.queries';
import { ConsentQuery } from '../consent/consent.queries';

@Injectable()
export class ParticipantService {
  constructor(
    private participantQuery: ParticipantQuery,
    private projectQuery: ProjectQuery,
    private consentQuery: ConsentQuery,
  ) {}

  /*************************************************
   * 참여기관 & 참여연구원 조회
   * 
   * @returns 
   ************************************************/
  async getProjectOrganizationInfo(params : any) {
    let { props , member , transaction } = params;
    let { protocolNoOrigin } = props

    // [1] 기관 리스트 조회 (삭제데이터 + 비노출 데이터 제외)
    let organizationOrigin : any = await this.participantQuery.getProjectOrganizationList({...params});
    let orgs = organizationOrigin.filter(x=>x.DELETE_YN === 'N' && x.DISPLAY_YN === 'Y')

    for(let org of orgs){
      org['organizationCd'] = org.ORGANIZATION_CD

      // [2] 참여 연구원 조회 (삭제데이터 )       ( 제한 연구자 (?) 제외 )
      let participantOrigin : any = await this.participantQuery.getProjectParticipantList({...params , org});
      // let participants = participantOrigin.filter(x=>x.DELETE_YN === 'N' && x.ACCESS_RESTRAINT_YN === 'N')
      let participants = participantOrigin.filter(x=>x.DELETE_YN === 'N')

      // [3] 연구원 권한 조회
      for(let item of participants){
        let roles : any = await this.participantQuery.getParticipantRole({...params , item});
        item['participantRole'] = roles.length === 0 ? null : roles
      }
      org['participantList'] = participants

    }

    return orgs
  }

}
