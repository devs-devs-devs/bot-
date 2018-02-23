import Command from './Command';
import Message from '../slack-types/Message';
import Megahal from '../services/Megahal';

export default class Markov extends Command {

    constructor() {
        super('markov', ['m', 'markov']);
        this.init();
    }

    async init() {
        // Does nothing
    }

    async reply(message: any, obj: any) {
        const [ text, trigger, action, ...params ] = Message.splitTrigger(message.text);
        return await Megahal.get(obj.teamId, [action, params].join(' ').trim());
    }

}
