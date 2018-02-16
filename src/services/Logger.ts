import * as bunyan from 'bunyan';

const { env } = process;
const BOT3_NAME = env.BOT3_NAME || 'Bot³ Name';

const log = bunyan.createLogger({name: BOT3_NAME });

export default log;
