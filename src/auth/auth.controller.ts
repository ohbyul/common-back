import { Controller, Get, Post, Request, Query, UseGuards, Param, Body, Put } from '@nestjs/common';
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
import { LoginDto } from 'src/dto/auth/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

import { TransactionParam } from 'src/decorator/transaction.deco';
import { Transaction } from 'sequelize';
import requestIp from 'request-ip';
import { PwdChangeDto } from 'src/dto/auth/pwd-change.dto';
import { AuthCodeDto } from 'src/dto/auth/auth-code.dto';


@ApiTags('AUTH API')
@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  /*************************************************
   * 로그인   
   * 
   * @param LoginDto
   * @returns 로그인 성공여부
   ************************************************/
  @Post('login')
  @ApiOperation({
    summary: '로그인 API',
    description: '멤버 포털 로그인',
  })
  @ApiBody({ type: LoginDto })
  async postLogin(@Request() req, @TransactionParam() transaction: Transaction) {
    let props: LoginDto = req.body;
    
    const clientIp = requestIp.getClientIp(req);
    props.ip = clientIp

    return this.authService.login({ props, transaction });
  }


}
