import { Injectable, UnauthorizedException,InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { CommonQuery } from './common.queries';

@Injectable()
export class CommonService {
  constructor(
    private commonQuery: CommonQuery,
  ) {}

} 

