import { Module } from '@nestjs/common';
import { AsientoService } from './asiento.service';
import { AsientoController } from './asiento.controller';
import { Asiento } from './entities/asiento.entity';
import { AsientoItem } from './entities/asiento-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Asiento, AsientoItem])],
  controllers: [AsientoController],
  providers: [AsientoService],
})
export class AsientoModule {}
