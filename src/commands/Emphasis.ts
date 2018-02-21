import Command from './command';
import Message from '../slack-types/Message';

export class Emphasis extends Command {

    constructor() {
        super('emphasis', ['e', 'emphasis']);
        this.init();
    }

    async init() {
        // Does nothing
    }

    async reply(message: any, obj: any) {
        const [ trigger, params ] = Message.splitTrigger(message.text, message.triggerPhrase);
        const action = params.split(' ')[0];

        const emoji = action[0] === ':' ? action : ':clap:';
        const sentence = action [0] === ':' ? params : `${action} ${params}`.trim();

        const emphasis = sentence.split(' ').join(` ${emoji }`).trim();

        if (!emphasis) return false;

        return `_${emphasis}_`;

    }

}
