import { OrderOptionDto } from './order-option.dto';
import { WhereOptionDto } from './where-option.dto.';

export class CommonPageDto<T extends OrderOptionDto, WhereOptionDto> {
  page: number;
  pageLength: number;
  whereOptions: T[]; 
  orderOptions: T[]; 
}
