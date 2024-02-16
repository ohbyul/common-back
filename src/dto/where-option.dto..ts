import { IsEnum } from "class-validator";

export class WhereOptionDto {
    where_key: string;
    where_value: string;
    where_type: string;
}

