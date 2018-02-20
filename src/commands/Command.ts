import Logger from '../services/Logger';
import chalk from 'chalk';
import { ISlackMessage } from '../interfaces/slack';

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

    reply(text: string, triggerPhrase: string): any {
        return text;
    }

    public static parseText(text: string = ''): any {
        const splitText = text.split(' ');
        return {
            trigger:splitText.shift() || '',
            action:splitText.shift() || '',
            params:splitText.join(' ')
        }
    }

}
