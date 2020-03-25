const Discord = require('discord.js');
const fetch = require('node-fetch');

const client = new Discord.Client();
var cached = {
    'whos-banned': {
        date: 0,
        result: '',
    },
    'fastest': {

    }
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.content.substring(0, 4) != '!ac ') {
        return;
    }
    else if (msg.content == '!ac whos-banned') {
        return acstats.whosBanned().then(response => {
            return msg.reply(response);
        });
    }
    else if (msg.content.indexOf('!ac fastest') > -1) {
        var model = msg.content.substr(12);
        if (!model) {
            return;
        }

        return acstats.fastest(model).then(response => {
            return msg.reply(response);
        });
    }
    else if (msg.content == '!ac help') {
        let data = acstats.help();

        return msg.reply(data);
    }
    else {
        msg.reply('I\'m not build to respond to that :(\n\nor am I..?');
    }
});

client.login(process.env.token);

var acstats = (function() {

    var api = {
        whosBanned: function() {
            var credits = '\nData taken from: https://acstats.eu/blacklist';

            // If we already retrieved this data in the past 30 minutes
            if (now() - cached['whos-banned'].date < 1800000) {
                return Promise.resolve(cached['whos-banned'].result);
            }

            var data = api.makeRequest('whos-banned');

            return data.then(data => {
                var reply = '';

                if (data.length == 0) {
                    reply += 'Currently there are **0** players banned!';
                } else {
                    reply += 'Currently there are **' + data.length + '** players banned!\n';
                    data.forEach(item => {
                        reply += '```md\n#' + item.name;
                        reply += item.banned_reason ? '\n[Reason]: ' + item.banned_reason : '';
                        reply += item.banned_till ? '\n[Banned till]: ' + item.banned_till : '';
                        reply += '```';
                    });
                }

                reply += credits;

                cached['whos-banned'] = {
                    date: now(),
                    result: reply
                };

                return reply;
            }).catch(err => {
                return 'Ohoh, something went wrong with displaying the banned players :/';
            });
        },

        fastestLaptime: function(model) {
            var cache = cached['fastest'][model];

            // If we already retrieved this data in the past 30 minutes
            if (cache && now() - cached['fastest'][model].date < 1800000) {
                console.log('cache');
                return Promise.resolve(cached['fastest'][model].result);
            }

            var data = api.makeRequest('fastest', model);

            return data.then(data => {
                var reply = '';

                if (data.length == 0 || data.times.length == 0) {
                    reply += 'Couldn\'t find any records for that one :(';
                } else {
                    data.times.forEach(item => {
                        reply += '```md\n';
                        reply += item.trackname == 'ks_nordschleife' ? 'Nordschleife' : item.trackname;
                        reply += ' ' + item.trackconfig + '\n';
                        reply += '[car]: ' + item.car + '\n';
                        reply += '[player]: ' + item.player + '\n';
                        reply += '[laptime]: ' + item.laptime + '\n';
                        reply += '```';
                    });

                    reply += '\nData taken from: ' + data.link;
                }

                cached['fastest'][model] = {
                    date: now(),
                    result: reply
                };

                return reply;
            }).catch(err => {
                return 'Ohoh, something went wrong with displaying the fastest time :/';
            });
        },

        help: function() {
            var reply = '```md\n';
            reply += '# !ac help:\n- Display all the commands\n\n';
            reply += '# !ac whos-banned:\n- Display all the currently banned players\n\n';
            reply += '# !ac fastest [car model]:\n- Shows the fastest laptime for a given car';
            reply += '```';

            return reply;
        },

        makeRequest: function(endpoint, data = '') {
            var result = fetch(`https://acstats.eu/api/${endpoint}?data=${encodeURI(data)}`);

            return result.then(resp => {
               if (resp.status == 200) {
                    return resp.json();
                }
                throw Error(resp.status);
            }).catch(); // Error is being handled by the caller function
        }
    }

    return {
        whosBanned: api.whosBanned,
        fastest: api.fastestLaptime,
        help: api.help,
    };
})();

function now() {
    return (new Date).getTime();
}
