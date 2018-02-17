import { Pool, createPool } from 'mysql2/promise';
import Logger from './Logger';
import chalk from 'chalk';

const { MYSQL_DB, MYSQL_USER, MYSQL_PASS, MYSQL_HOST } = process.env;

class BotData {

    public static pool: Pool;
    private serviceName: any = chalk.yellow('Data:');

    constructor() {
        Logger.info(this.serviceName, 'service loaded');
        BotData.pool = this.createPool();
    }

    createPool() {
        if (BotData.pool) return BotData.pool;
        BotData.pool = createPool({
            connectionLimit: 10,
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASS,
            database: MYSQL_DB
        });
        return BotData.pool;
    }

    getPool() {
        return BotData.pool;
    }

}

export default new BotData();
