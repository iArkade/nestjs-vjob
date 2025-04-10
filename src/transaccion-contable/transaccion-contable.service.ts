import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransaccionContableDto } from './dto/create-transaccion-contable.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransaccionContable } from './entities/transaccion-contable.entity';
import {  Not, Repository } from 'typeorm';
import { UpdateTransaccionContablenDto } from './dto/update-transaccion-contable.dto';
import { Asiento } from '../asiento/entities/asiento.entity';

@Injectable()
export class TransaccionContableService {
    constructor(
        @InjectRepository(TransaccionContable)
        private transactionRepository: Repository<TransaccionContable>,
        @InjectRepository(Asiento)
        private asientoRepository: Repository<Asiento>,
    ) { }

    private normalizeCode(code: string): string {
        return code.endsWith('.') ? code.slice(0, -1) : code;
    }


    async create(createTransaccionContableDto: CreateTransaccionContableDto & { empresa_id: number }) {
        const { codigo_transaccion, empresa_id } = createTransaccionContableDto;
        const normalizedCode = this.normalizeCode(codigo_transaccion); // Normalizamos el código

        // Verificar si el código ya existe (evitar duplicados como `1.1` y `1.1.`)
        const existingAccount = await this.transactionRepository.findOne({ where: { codigo_transaccion: normalizedCode, empresa_id } });
        if (existingAccount) {
            throw new BadRequestException('El código ya existe.');
        }

        // Guardar la cuenta
        return await this.transactionRepository.save(createTransaccionContableDto);
    }

    async createMany(createTransaccionContableDtos: (CreateTransaccionContableDto & { empresa_id: number })[]) {
        if (!Array.isArray(createTransaccionContableDtos)) {
            throw new TypeError('createTransaccionContableDtos debe ser un array');
        }

        // Filtrar filas vacías o incompletas
        const validDtos = createTransaccionContableDtos.filter(dto => dto.codigo_transaccion && dto.nombre && dto.secuencial && dto.empresa_id);
        for (const createTransaccionContableDto of validDtos) {

            await this.create(createTransaccionContableDto);
        }
    }

    async findAllPaginated(page: number, limit: number, empresaId: number): Promise<{ data: TransaccionContable[], total: number }> {
        const [result, total] = await this.transactionRepository.findAndCount({
            where: { empresa_id: empresaId },
            order: { codigo_transaccion: 'ASC' },
        });

        const paginatedResult = result.slice((page - 1) * limit, page * limit);

        return {
            data: paginatedResult,
            total,
        };
    }

    async findAll(empresaId: number): Promise<TransaccionContable[]> {
        // Traer todos los registros de la base de datos
        const result = await this.transactionRepository.find({
            where: { empresa_id: empresaId },
            order: { codigo_transaccion: 'ASC' }, // Ordenar por el campo 'code'
        });

        return result;
    }


    async findOne(id: number, empresaId: number) {
        const transaction = await this.transactionRepository.findOne({ where: { id, empresa_id: empresaId } });
        if (!transaction) throw new NotFoundException('Transaction not found');
        return transaction;
    }

    async update(id: number, updateTransaccionContableDto: UpdateTransaccionContablenDto, empresaId: number) {
        const transaction = await this.transactionRepository.findOne({ where: { id, empresa_id: empresaId } });
        if (!transaction) throw new NotFoundException('Transaction not found');

        const relatedAsiento = await this.asientoRepository.findOne({ where: { codigo_transaccion: transaction.codigo_transaccion, empresa_id: empresaId } });
        if (relatedAsiento) {
            throw new BadRequestException('No se puede actualizar la transaccion porque está relacionado con un asiento.');
        }

        // Verificar si se está intentando duplicar el código
        if (updateTransaccionContableDto.codigo_transaccion) {
            const newCode = updateTransaccionContableDto.codigo_transaccion.trim();
            const codeAlreadyExists = await this.transactionRepository.findOne({
                where: { codigo_transaccion: newCode, empresa_id: empresaId, id: Not(id) }
            });
            if (codeAlreadyExists) {
                throw new BadRequestException('El código ya existe.');
            }
            transaction.codigo_transaccion = newCode;
        }

        // Actualizar los demás campos
        transaction.nombre = updateTransaccionContableDto.nombre || transaction.nombre;
        transaction.secuencial = updateTransaccionContableDto.secuencial || transaction.secuencial;

        // Actualizar el campo "lectura"
        if (updateTransaccionContableDto.lectura !== undefined) {
            transaction.lectura = updateTransaccionContableDto.lectura;
        }

        // Actualizar el campo "activo"
        if (updateTransaccionContableDto.activo !== undefined) {
            transaction.activo = updateTransaccionContableDto.activo;
        }

        return await this.transactionRepository.save(transaction);
    }

    async remove(codigo_transaccion: string, empresaId: number) {

        let transaction = await this.transactionRepository.findOne({ where: { codigo_transaccion, empresa_id: empresaId } });
        if (!transaction) {
            throw new BadRequestException('La transaccion no existe.');
        }

        const relatedAsiento = await this.asientoRepository.findOne({ where: { codigo_transaccion: codigo_transaccion, empresa_id: empresaId } });
        if (relatedAsiento) {
            throw new BadRequestException('No se puede eliminar la transaccion porque está relacionado con un asiento.');
        }

        
        try {
            await this.transactionRepository.remove(transaction);
            return { message: 'Transaccion eliminada exitosamente', codigo_transaccion: transaction.codigo_transaccion };
        } catch (error) {
            throw new BadRequestException('Error al eliminar la transaccion. Por favor, inténtelo de nuevo.');
        }

    }

}
