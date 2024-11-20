import { Module } from '@nestjs/common';
import { DatCentroService } from './dat_centro.service';
import { DatCentroController } from './dat_centro.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatCentro } from './entities/dat_centro.entity';
import { Asiento } from 'src/asiento/entities/asiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DatCentro, Asiento])],
  controllers: [DatCentroController],
  providers: [DatCentroService],
})
export class DatCentroModule {}
