import { PartialType } from '@nestjs/swagger';
import { CreateDatCentroDto } from './create-dat_centro.dto';

export class UpdateDatCentroDto extends PartialType(CreateDatCentroDto) {}
