const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migrations1726618718007 {
    name = 'Migrations1726618718007'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`prueba\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`tokens\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`tokens\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`accounting_plan\` CHANGE \`company_code\` \`company_code\` varchar(255) NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`accounting_plan\` CHANGE \`company_code\` \`company_code\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`tokens\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`tokens\` varchar(1000) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`prueba\` varchar(255) NULL`);
    }
}
