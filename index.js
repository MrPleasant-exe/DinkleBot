process.env.TZ = "GB";
const Discord = require('discord.js');
const client = new Discord.Client();

const rp = require('request-promise');
const tokens = require('./conf.json');

const getOpts = uri => ({
  headers: {
    "Authorization": "Token token=" + tokens.the100.api_token
  },
  method: 'GET',
  uri
})

const api = (method) =>
  rp(getOpts("https://www.the100.io/api/v2/" + method )).then(JSON.parse)

const sortByDate = raids =>
  raids.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

function diff_minutes(dt2, dt1) {
  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

const minutesLeft = raid =>
  diff_minutes(new Date(), new Date(raid.start_time))

const stringifyRaid = raid =>
(`Your next raid starts in ${minutesLeft(raid)} minutes

Lobby: https://the100.io/game/${raid.id}
Name: ${raid.name}
Game: ${raid.game_name}
Date: ${raid.start_time}
Confirmed attendants: ${raid.confirmed_sessions.map(u => u.user.gamertag).join(', ')}`);

const getNextRaid = raids => sortByDate(raids)[0]

const getRaids = () => api('users/' + tokens.the100.id + '/gaming_sessions')

const _isCommand = (prefix, text) => {
	const commandPrefix = '^' + (prefix === '$' ? '\\$' : prefix);
	const commandMiddle = '[a-z]+';
	const regex = new RegExp(commandPrefix + commandMiddle, 'i');

	if (regex.test(text)) {
		const splatArgs = text.split(' ');
		const command = splatArgs[0].substr(prefix.length);
		const args = splatArgs.slice(1);

		return {
			status: true,
			command,
			args
		};
	} else {
		return {
			status: false
		};
	}
};

client.login(tokens.discord.bot_token).then(() => dm(adminId, "Hi, I either just started or got rebooted!"));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
	const isCommand = _isCommand('$', msg.content);
	if (isCommand.status) {
		client.emit('command:' + isCommand.command.toLowerCase(), {isCommand, msg});
	}
});

const dm = (id, msg) =>
  client.users.cache.get(id).send(msg)

client.on('command:getid', ctx => {
  const id = ctx.msg.author.id
  dm(id, id)
});

const adminId = tokens.user_id
client.users.fetch(adminId, {cache: true})
let lastRaidNotified = 0

const notify = raid =>
  dm(adminId, stringifyRaid(raid))

const punctualityCheckup = () =>
  getRaids().then(getNextRaid).then(raid => {
    const _mins = minutesLeft(raid)

    // if (_mins <= 1 && lastRaidNotified !== raid.id) {
    //   lastRaidNotified = raid.id
    //   notify(raid)
    // }
    
    // // Raid in 5 minutes
    // if (_mins <= 5 && lastRaidNotified !== raid.id) {
    //   lastRaidNotified = raid.id
    //   notify(raid)
    // }

    if (_mins <= 20 && lastRaidNotified !== raid.id) {
      lastRaidNotified = raid.id
      notify(raid)
    }

    // if (_mins <= 30 && lastRaidNotified !== raid.id) {
    //   lastRaidNotified = raid.id
    //   notify(raid)
    // }
    
    // if (_mins <= 60 && lastRaidNotified !== raid.id) {
    //   lastRaidNotified = raid.id
    //   notify(raid)
    // }

    // if (_mins <= 300 && lastRaidNotified !== raid.id) {
    //   lastRaidNotified = raid.id
    //   notify(raid)
    // }

    // One day is 1440 minutes
  })

client.on('command:nextraid', ctx => {
  getRaids().then(getNextRaid).then(raid => {
    const id = ctx.msg.author.id
    dm(id, stringifyRaid(raid))
  })
});

// Check every 5 seconds
setInterval(punctualityCheckup, 120*1000)

client.on('error', console.error);