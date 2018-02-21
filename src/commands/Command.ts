import Logger from '../services/Logger';
import chalk from 'chalk';

export interface CommandInterface {
    reply: any
}

export interface CommandReplyInterface {
    text: string
}

export default class Command implements CommandInterface {

    public name: string = 'hello-world';
    public commands: string[] = ['hello'];

    constructor(name: string, commands: string[]) {
        if (name && commands) {
            this.name = name;
            this.commands = commands
        }
        Logger.info(chalk.magenta(this.name), 'loaded');
    }

    reply(message: any, obj: any): any {
        return message.text || '';
    }

    public static parseText(text: string = ''): any {
        const splitText = text.split(' ');
        return {
            trigger:splitText.shift() || '',
            action:splitText.shift() || '',
            params:splitText.join(' ')
        }
    }

    parseText(text: string = ''): any {
        const splitText = text.split(' ');
        return {
            trigger:splitText.shift() || '',
            action:splitText.shift() || '',
            params:splitText.join(' ')
        }
    }

}
