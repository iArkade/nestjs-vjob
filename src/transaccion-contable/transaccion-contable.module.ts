import { Module } from '@nestjs/common';
import { TransaccionContableService } from './transaccion-contable.service';
import { TransaccionContableController } from './transaccion-contable.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionContable } from './entities/transaccion-contable.entity';

@Module({
    imports: [TypeOrmModule.forFeature([TransaccionContable])],
    controllers: [TransaccionContableController],
    providers: [TransaccionContableService],
})
export class TransaccionContableModule {}

