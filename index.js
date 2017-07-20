'use strict';

const https = require('https');
const Alexa = require('alexa-sdk');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const { statusCode } = res;
            if (statusCode !== 200) {
                reject(`Request Failed.\nStatus Code: ${statusCode}`);
                res.resume();
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                resolve(rawData);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function getDays() {
    return httpsGet('https://dayssincelastjavascriptframework.com/').then((data) => {
        const daysSearch = data.match(/<strong>(.*)<\/strong>/);
        if (!daysSearch || daysSearch.length < 2) {
            throw new Error('Days not found in response!');
        }
        const days = parseInt(daysSearch[1]);
        return days;
    });
}

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Days Since Last Javascript Framework',
            HELP_MESSAGE: 'You can ask me how many days since last JavaScript framework was released, or, you can say exit... What can I help you with?',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Goodbye!',
            DAYS_MESSAGE: 'since the latest JavaScript framework was published.',
            DAY: 'day',
            DAYS: 'days',
            THERE_HAS_BEEN: 'There has been',
            THERE_HAVE_BEEN: 'There have been',
        },
    },
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetDays');
    },
    'DaysIntent': function () {
        this.emit('GetDays');
    },
    'GetDays': function () {
        getDays().then((days) => {
            const start = this.t(days === 1? 'THERE_HAS_BEEN': 'THERE_HAVE_BEEN');
            const card = days === 1? `1 ${this.t('DAY')}`: `${days} ${this.t('DAYS')}`;
            const speechOutput = `${start} ${card} ${this.t('DAYS_MESSAGE')}`;
            this.emit(':tellWithCard', speechOutput, this.t('SKILL_NAME'), card);
        }).catch(console.error);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
