import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransaccionContableDto } from './dto/create-transaccion-contable.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransaccionContable } from './entities/transaccion-contable.entity';
import { Like, Not, Raw, Repository } from 'typeorm';
import { UpdateTransaccionContablenDto } from './dto/update-transaccion-contable.dto';

@Injectable()
export class TransaccionContableService {
    constructor(
        @InjectRepository(TransaccionContable)
        private transactionRepository: Repository<TransaccionContable>,
    ) { }

    private normalizeCode(code: string): string {
        return code.endsWith('.') ? code.slice(0, -1) : code;
    }


    async create(createTransaccionContableDto: CreateTransaccionContableDto) {
        const { codigo_transaccion } = createTransaccionContableDto;
        const normalizedCode = this.normalizeCode(codigo_transaccion); // Normalizamos el código

        // Verificar si el código ya existe (evitar duplicados como `1.1` y `1.1.`)
        const existingAccount = await this.transactionRepository.findOne({ where: { codigo_transaccion: normalizedCode } });
        if (existingAccount) {
            throw new BadRequestException('El código ya existe.');
        }

        // Guardar la cuenta
        return await this.transactionRepository.save(createTransaccionContableDto);
    }

    async createMany(createTransaccionContableDtos: CreateTransaccionContableDto[]) {
        if (!Array.isArray(createTransaccionContableDtos)) {
            throw new TypeError('createTransaccionContableDtos debe ser un array');
        }

        // Filtrar filas vacías o incompletas
        const validDtos = createTransaccionContableDtos.filter(dto => dto.codigo_transaccion && dto.nombre && dto.secuencial);
        for (const createTransaccionContableDto of validDtos) {

            await this.create(createTransaccionContableDto);
        }
    }

    async findAllPaginated(page: number, limit: number): Promise<{ data: TransaccionContable[], total: number }> {
        const [result, total] = await this.transactionRepository.findAndCount({
            order: { codigo_transaccion: 'ASC' },
        });

        const paginatedResult = result.slice((page - 1) * limit, page * limit);

        return {
            data: paginatedResult,
            total,
        };
    }

    async findAll(): Promise<TransaccionContable[]> {
        // Traer todos los registros de la base de datos
        const result = await this.transactionRepository.find({
            order: { codigo_transaccion: 'ASC' }, // Ordenar por el campo 'code'
        });

        return result;
    }


    async findOne(id: number) {
        const transaction = await this.transactionRepository.findOne({ where: { id } });
        if (!transaction) throw new NotFoundException('Transaction not found');
        return transaction;
    }

    async update(id: number, updateTransaccionContableDto: UpdateTransaccionContablenDto) {
        const transaction = await this.transactionRepository.findOne({ where: { id } });
        if (!transaction) throw new NotFoundException('Transaction not found');

        // Verificar si se está intentando duplicar el código
        if (updateTransaccionContableDto.codigo_transaccion) {
            const newCode = updateTransaccionContableDto.codigo_transaccion.trim();
            const codeAlreadyExists = await this.transactionRepository.findOne({
                where: { codigo_transaccion: newCode, id: Not(id) }
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

    async remove(codigo_transaccion: string) {

        let transaction = await this.transactionRepository.findOne({ where: { codigo_transaccion } });
        try {
            await this.transactionRepository.remove(transaction);
            return { message: 'Transaccion eliminada exitosamente', codigo_transaccion: transaction.codigo_transaccion };
        } catch (error) {
            throw new BadRequestException('Error al eliminar la transaccion. Por favor, inténtelo de nuevo.');
        }

    }

}
