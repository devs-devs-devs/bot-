import Command from './Command';
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
        const [ text, trigger, action, ...params ] = Message.splitTrigger(message.text);

        if (!params.length) return;

        let emoji = ':clap:';

        if (action[0] === ':' && action[action.length - 1] === ':') {
            emoji = action;
        } else {
            params.unshift(action);
        }

        const sentence = params.join(` ${emoji} `);

        return `_${sentence}_`;
    }

}
