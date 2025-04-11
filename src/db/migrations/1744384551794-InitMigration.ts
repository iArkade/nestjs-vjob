import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1744384551794 implements MigrationInterface {
    name = 'InitMigration1744384551794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`accounting_plan\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`empresa_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ebbc30375f06c35f5b3861eb41\` (\`empresa_id\`, \`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`name\` varchar(255) NULL, \`lastname\` varchar(255) NULL, \`password\` varchar(255) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`systemRole\` enum ('superadmin', 'user') NOT NULL DEFAULT 'user', \`tokens\` varchar(2024) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdById\` int NULL, UNIQUE INDEX \`IDX_2863682842e688ca198eb25c12\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`empresa\` (\`id\` int NOT NULL AUTO_INCREMENT, \`codigo\` varchar(255) NOT NULL, \`ruc\` varchar(255) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`correo\` varchar(255) NOT NULL, \`telefono\` varchar(255) NOT NULL, \`direccion\` varchar(255) NOT NULL, \`logo\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdById\` int NOT NULL, UNIQUE INDEX \`IDX_4c869c777d5e8181ea001eef26\` (\`codigo\`), UNIQUE INDEX \`IDX_dc656dc24f6986afbfe84ebf13\` (\`ruc\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario_empresa\` (\`id\` int NOT NULL AUTO_INCREMENT, \`companyRole\` enum ('admin', 'user') NOT NULL DEFAULT 'user', \`assigned_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`usuarioId\` int NULL, \`empresaId\` int NULL, \`assigned_by\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`permisos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`rol\` varchar(255) NOT NULL, \`recurso\` varchar(255) NOT NULL, \`accion\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`asiento_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`codigo_centro\` varchar(255) NOT NULL, \`cta\` varchar(255) NOT NULL, \`cta_nombre\` varchar(255) NOT NULL, \`debe\` decimal(12,2) NOT NULL DEFAULT '0.00', \`haber\` decimal(12,2) NOT NULL DEFAULT '0.00', \`nota\` varchar(255) NULL, \`asiento_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`asiento\` (\`id\` int NOT NULL AUTO_INCREMENT, \`empresa_id\` int NOT NULL, \`fecha_emision\` date NULL, \`nro_asiento\` varchar(255) NULL, \`comentario\` varchar(255) NULL, \`codigo_transaccion\` varchar(255) NOT NULL, \`estado\` varchar(255) NOT NULL, \`nro_referencia\` varchar(255) NULL, \`codigo_centro\` varchar(255) NOT NULL, \`total_debe\` decimal(10,2) NOT NULL, \`total_haber\` decimal(10,2) NOT NULL, INDEX \`IDX_8463d78eaa7b2d0c2f8f429dd8\` (\`empresa_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`login-history\` (\`id\` int NOT NULL AUTO_INCREMENT, \`ip\` varchar(255) NOT NULL, \`browser\` varchar(255) NOT NULL, \`os\` varchar(255) NOT NULL, \`userId\` int NOT NULL, \`userName\` varchar(255) NOT NULL, \`timestamp\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transaccion-contable\` (\`id\` int NOT NULL AUTO_INCREMENT, \`empresa_id\` int NOT NULL, \`codigo_transaccion\` varchar(255) NOT NULL, \`nombre\` varchar(255) NULL, \`secuencial\` varchar(255) NULL, \`lectura\` int NULL DEFAULT '0', \`activo\` tinyint NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_921d0a8a6528eba7a1ed443795\` (\`empresa_id\`, \`codigo_transaccion\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`dat_centro\` (\`id\` int NOT NULL AUTO_INCREMENT, \`empresa_id\` int NOT NULL, \`codigo\` varchar(255) NOT NULL, \`nombre\` varchar(255) NULL, \`activo\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_d1e39417923e8156c3c4865289\` (\`empresa_id\`, \`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`accounting_plan\` ADD CONSTRAINT \`FK_a32c59a0e5ea26ae77e875a3cb2\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresa\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`usuario\` ADD CONSTRAINT \`FK_c652256d14a73ad4b9ab24bfc3b\` FOREIGN KEY (\`createdById\`) REFERENCES \`usuario\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`empresa\` ADD CONSTRAINT \`FK_1be545ec0c73182a5e229f5dd52\` FOREIGN KEY (\`createdById\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`usuario_empresa\` ADD CONSTRAINT \`FK_d30bc287311e7da4aa9757d5a5d\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`usuario_empresa\` ADD CONSTRAINT \`FK_802d1738e306004674232be8fd6\` FOREIGN KEY (\`empresaId\`) REFERENCES \`empresa\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`usuario_empresa\` ADD CONSTRAINT \`FK_56e2dbdd08d23ffb5e7f8875e82\` FOREIGN KEY (\`assigned_by\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`asiento_item\` ADD CONSTRAINT \`FK_1b05cec4c09c53150e94840a4ea\` FOREIGN KEY (\`asiento_id\`) REFERENCES \`asiento\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`asiento_item\` DROP FOREIGN KEY \`FK_1b05cec4c09c53150e94840a4ea\``);
        await queryRunner.query(`ALTER TABLE \`usuario_empresa\` DROP FOREIGN KEY \`FK_56e2dbdd08d23ffb5e7f8875e82\``);
        await queryRunner.query(`ALTER TABLE \`usuario_empresa\` DROP FOREIGN KEY \`FK_802d1738e306004674232be8fd6\``);
        await queryRunner.query(`ALTER TABLE \`usuario_empresa\` DROP FOREIGN KEY \`FK_d30bc287311e7da4aa9757d5a5d\``);
        await queryRunner.query(`ALTER TABLE \`empresa\` DROP FOREIGN KEY \`FK_1be545ec0c73182a5e229f5dd52\``);
        await queryRunner.query(`ALTER TABLE \`usuario\` DROP FOREIGN KEY \`FK_c652256d14a73ad4b9ab24bfc3b\``);
        await queryRunner.query(`ALTER TABLE \`accounting_plan\` DROP FOREIGN KEY \`FK_a32c59a0e5ea26ae77e875a3cb2\``);
        await queryRunner.query(`DROP INDEX \`IDX_d1e39417923e8156c3c4865289\` ON \`dat_centro\``);
        await queryRunner.query(`DROP TABLE \`dat_centro\``);
        await queryRunner.query(`DROP INDEX \`IDX_921d0a8a6528eba7a1ed443795\` ON \`transaccion-contable\``);
        await queryRunner.query(`DROP TABLE \`transaccion-contable\``);
        await queryRunner.query(`DROP TABLE \`login-history\``);
        await queryRunner.query(`DROP INDEX \`IDX_8463d78eaa7b2d0c2f8f429dd8\` ON \`asiento\``);
        await queryRunner.query(`DROP TABLE \`asiento\``);
        await queryRunner.query(`DROP TABLE \`asiento_item\``);
        await queryRunner.query(`DROP TABLE \`permisos\``);
        await queryRunner.query(`DROP TABLE \`usuario_empresa\``);
        await queryRunner.query(`DROP INDEX \`IDX_dc656dc24f6986afbfe84ebf13\` ON \`empresa\``);
        await queryRunner.query(`DROP INDEX \`IDX_4c869c777d5e8181ea001eef26\` ON \`empresa\``);
        await queryRunner.query(`DROP TABLE \`empresa\``);
        await queryRunner.query(`DROP INDEX \`IDX_2863682842e688ca198eb25c12\` ON \`usuario\``);
        await queryRunner.query(`DROP TABLE \`usuario\``);
        await queryRunner.query(`DROP INDEX \`IDX_ebbc30375f06c35f5b3861eb41\` ON \`accounting_plan\``);
        await queryRunner.query(`DROP TABLE \`accounting_plan\``);
    }

}
