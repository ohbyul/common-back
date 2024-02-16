import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserTracking } from '../lib/user-tracking';
@Injectable()
export class TrackingInterceptor implements NestInterceptor {
  // constructor(private userTracking UserTracking){}
  private readonly logger = new Logger("Tracking");

  intercept(context: ExecutionContext,next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    //Controller 가기 전 부분

    return next.handle()
    //Controller 실행되고 난 후 부분
    .pipe(
      map(data => {
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        if(data.statusCode == 10000){
          this.logger.debug(request.originalUrl)
        }

        
        // const _body = JSON.stringify(data ? data : '');
        // this.logger.debug("=========================================================");
        // this.logger.debug(`   body         =======> ${_body}`);
        // this.logger.debug("=========================================================");

        return data;
      }),
    );
  }
}