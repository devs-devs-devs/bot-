import { Pool } from 'mysql2/promise';
import BotData from '../services/Data';
import Command from './Command';
import Message from '../slack-types/Message';

const shuffle = (a: any[]) => {
    a = a || [];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};


export default class RightThere extends Command {

    private pool: Pool = BotData.getPool();

    constructor() {
        super('RightThere', ['rt']);
        this.init();
    }

    async init() {

    }

    async reply(message: any, obj: any) {

        let [text, trigger, shit, ...emojis] = Message.splitTrigger(message.text);

        if (!shit) shit = 'good';
        if (!emojis.length) emojis = [':100:', ':ok_hand:', ':eyes:'];

        const reply = [];
        reply.push(this.randomEmojis(emojis, 7));
        reply.push(`${shit} shit`);
        reply.push(this.mixWordCase(`${shit} shit`));
        reply.push(this.randomEmojis(emojis, 1));
        reply.push('thats');
        reply.push(this.randomEmojis(emojis, 1));
        reply.push(`some ${shit}`);
        reply.push(this.randomEmojis(emojis, 2));
        reply.push(`shit right`);
        reply.push(this.randomEmojis(emojis, 2));
        reply.push(`there`);
        reply.push(this.randomEmojis(emojis, 3));
        reply.push(`right`);
        reply.push(this.randomEmojis(emojis, 1));
        reply.push(`there`);
        reply.push(this.randomEmojis(emojis, 2));
        reply.push(`if i do say so myself`);
        reply.push(this.randomEmojis(emojis, 1));
        reply.push(`i say so`);
        reply.push(this.randomEmojis(emojis, 1));
        reply.push(`thats what im talking about right there right there (chorus: ᶦᵗ'ˢ ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ`);
        reply.push(this.randomEmojis(emojis, 4));
        reply.push(`ZO0ОଠOOOOOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒᵐ:`);
        reply.push(this.randomEmojis(emojis, 10));
        reply.push(`${shit} shit`);

        return reply.join(' ');

    }

    public mixWordCase(word: string) {
        let newWord = '';
        for (let i=0;i<word.length;i++) {
            newWord += word[i][Math.random() >= 0.5 ? 'toUpperCase' : 'toLowerCase']();
        }
        return newWord;
    }

    public randomEmojis(emojis: string[], emojiLength: number = 5) {

        let string = '';

        for (let i=0; i<emojiLength; i++) string += shuffle(emojis)[0];

        return string;

    }

}
