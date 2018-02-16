import { Pool, createPool } from 'mysql2/promise';
import Logger from './Logger';
import chalk from 'chalk';

const { MYSQL_DB, MYSQL_USER, MYSQL_PASS, MYSQL_HOST } = process.env;

class Data {

    public pool: Pool;
    private serviceName: any = chalk.yellow('Data:');

    constructor() {
        Logger.info(this.serviceName, 'service loaded');
    }

    async createPool() {
        if (this.pool) return this.pool;
        try {
            this.pool = await createPool({
                connectionLimit: 10,
                host: MYSQL_HOST,
                user: MYSQL_USER,
                password: MYSQL_PASS,
                database: MYSQL_DB
            });
            Logger.info(this.serviceName, 'Pool created');
        } catch(e) {
            throw Logger.error('Unable to create MySQL pool', { MYSQL_DB, MYSQL_USER, MYSQL_HOST });
        }
        return this.pool;
    }

    async getPool() {
        return await this.createPool();
    }

}

export default new Data();
