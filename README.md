<div align="center">
  <p>
    <a href="https://www.npmjs.com/package/djs-util"><img src="https://img.shields.io/npm/v/djs-util.svg?maxAge=3600" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/djs-util"><img src="https://img.shields.io/npm/dt/djs-util.svg?maxAge=3600" alt="npm downloads" /></a>
  </p>
</div>

# djs-util
A command handler library for Discord.js

**NOTE:** This library is still under development and does not have a stable release version

## Install
This package can be installed using npm or yarn:

`npm install djs-util` or `yarn add djs-util`

## Usage
Basic usage goes as follows:
```js
import { Client, Intents } from 'discord.js'
import { SlashCommandHandler } from 'djs-util'

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const slashCommandHandler = new SlashCommandHandler(client, "012345678912345678", "botToken", {
	directories: ["path/to/commands"]
})
```

### SlashCommandHandler Options
- **directories: string[]** - `List of directories to search through`
- **guild_id: string** - `ID of guild to handle commands on`
- **refresh: boolean** - `Refresh commands on startup (Global commands might take longer to refresh)`
