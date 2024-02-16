import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import moment from 'moment';
import path from 'path';

@Injectable()
export class AppService {
    private uploadServerPath = process.env['ATTACHMENT_FILE_PATH'];
    /*************************************************
     * 첨부파일 전처리
     * 
     * @param {file[]} files
     * @param {file[]} folderPath /notice
     * @returns 
     ************************************************/
    async processingFiles(files: any, folderPath: string) {
        let filePath = this.uploadServerPath + folderPath

        for (let file of files) {
            let extensionCheck: string = file.originalname.substring(
                file.originalname.lastIndexOf('.'),
                file.originalname.length,
            );
            let extension: string;
            let timestamp: string;

            if (
                extensionCheck === '.vnd' ||
                extensionCheck === '.haansofthwp' ||
                extensionCheck === '.x' ||
                extensionCheck === '.plain'
            ) {
                extension = path.extname(
                    file.originalname.split(extensionCheck)[0],
                );
                timestamp = moment(new Date()).utc().format('x');
            } else {
                extension = path.extname(file.originalname);
                timestamp = moment(new Date()).utc().format('x');
            }

            if (!existsSync(filePath)) {
                // uploads 폴더가 존재하지 않을시, 생성합니다.
                mkdirSync(filePath);
            }

            //파일 이름
            const fileName = timestamp + extension;
            //파일 업로드 경로
            const uploadPath =`${filePath + '/' + fileName}`;

            //파일 생성
            writeFileSync(uploadPath, file.buffer); // file.path 임시 파일 저장소

            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 한글 파일명 깨짐처리
            file.fileSavedName = timestamp;
            file.path = uploadPath;
        }
        return files;
    }
}
