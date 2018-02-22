import Command from './Command';
import qdb = require('qdb-api');

export class QDB extends Command {

    constructor() {
        super('QDB', ['bash']);
        this.init();
    }

    async init() {
        // Does nothing
    }

    async reply(message: any, obj: any) {

        const quote = await qdb.random();
        return '```'+quote.text+'```';

    }

}
