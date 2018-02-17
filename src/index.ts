#!/usr/bin/env node
"use strict";

import GitHubWebHook from './services/Github';

require('dotenv').config();

const { env } = process;

const canRun = [
    'BOT3_EXPRESS_PORT'
].every((envVar: string) => {
    return env.hasOwnProperty(envVar) && env[envVar] !== '';
});

if (!canRun) throw new Error(`Please check all the environment variables exist`);

import * as express from 'express';
import * as bodyParser from 'body-parser';
import chalk from 'chalk';
import Logger from './services/Logger';
import Daemon from './services/Daemon';

process.chdir(__dirname);

const app = express();
app.use(bodyParser.json());

new GitHubWebHook(app);

app.listen(env.BOT3_EXPRESS_PORT, () => {
    Logger.info(chalk.green('Express'), `Listening on port: ${env.BOT3_EXPRESS_PORT}`);

    Daemon.init();

});
