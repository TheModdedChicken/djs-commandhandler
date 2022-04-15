import fs from 'fs'
import path from 'path'
import { REST } from '@discordjs/rest';
import { Client, Collection, Intents, Interaction, MessageEmbed } from 'discord.js'
import { IInteractionEventFunction, IInteractionEvents, IInteractionMiddleware, ISlashCommand } from '../interfaces';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Routes } from 'discord-api-types/v9';

export default class SlashCommandHandler {
  private _rest;
  private _client: Client
  private _client_id: string
  private _guild_id: string | undefined
  private _bot_token: string
  private _directories: string[] = []
  private _commands = new Collection<string, ISlashCommand>()

  private _events: IInteractionEvents = {
    interactionSuccess: [],
    interactionFailed: []
  }

  private _middleware: IInteractionMiddleware[] = [

  ]

  /**
   * 
   * @param client Bot client to read from
   * @param client_id ID of bot client
   * @param bot_token Token of bot client
   */
  constructor(client: Client, client_id: string, bot_token: string, options?: {
    /** Directories to search for slash commands in */
    directories?: string[],
    /** ID of guild */
    guild_id?: string,
    /** Refresh commands on startup (Global commands might take longer to refresh) */
    refresh?: boolean
  }) {
    this._client = client;
    this._client_id = client_id;
    this._guild_id = options?.guild_id;
    this._bot_token = bot_token;
    this._rest = new REST({ version: '9' }).setToken(this._bot_token);

    if (options?.directories) this.directories = options.directories;
    this.loadDirectories();
    if (options?.refresh) this.refreshCommands(this._guild_id ? false : true);

    this._client.on('interactionCreate', async (i: Interaction) => {
      var stop = false;
      for (const func of this._middleware) {
        await func(i, () => stop = true);
        if (stop) return;
      }

      try {
        if (!i.isApplicationCommand()) return;
        const command: ISlashCommand | undefined = this._commands.get(i.commandName);
        if (!command) throw new Error(`Couldn't find command with name '${i.commandName}'`)

        if (i.isCommand()) { await command.command(i) }
        else if (i.isAutocomplete()) { command.autocomplete ? await command.autocomplete(i) : console.error(`Couldn't find autocomplete function under command with name '${command.data.name}'`); }
        else if (i.isButton()) { command.button ? await command.button(i) : console.error(`Couldn't find button function under command with name '${command.data.name}'`); }
        else if (i.isContextMenu()) { command.contextMenu ? await command.contextMenu(i) : console.error(`Couldn't find contextMenu function under command with name '${command.data.name}'`); }
        else if (i.isMessageContextMenu()) { command.messageContextMenu ? await command.messageContextMenu(i) : console.error(`Couldn't find messageContextMenu function under command with name '${command.data.name}'`); }
        else if (i.isUserContextMenu()) { command.userContextMenu ? await command.userContextMenu(i) : console.error(`Couldn't find userContextMenu function under command with name '${command.data.name}'`); }

        this.triggerEvent('interactionSuccess', i);
      } catch (err) { this.triggerEvent('interactionFailed', i, err) }
    })
  }

  /**
   * Add listener to an event
   * @param event Event to listen for
   * @param listener Listener to add
   */
  on<k extends keyof IInteractionEvents> (event: k, listener: IInteractionEventFunction) { this._events[event].push(listener) }
  /**
   * Remove listener from an event
   * @param event Event to remove listener from
   * @param listener Listener to remove
   */
  off<k extends keyof IInteractionEvents> (event: k, listener: IInteractionEventFunction) { this._events[event] = this._events[event].filter(l => l !== listener) }

  private triggerEvent<k extends keyof IInteractionEvents> (event: k, interaction: Interaction, err?: unknown) {
    for (const listener of this._events[event]) listener(interaction, err);
  }

  /**
   * Add middleware which executes before interactions get processed
   * @param callback Middleware to add
   */
  middleware (callback: IInteractionMiddleware) { this._middleware.push(callback); return this; }

  /**
   * Set the default directories to search for slash commands in
   * @param directories Directories to search for slash commands in
   */
  set directories (directories: string[]) { 
    const out = [];
    for (const dir of directories) out.push(path.isAbsolute(dir) ? dir : path.join(__dirname, dir));
    this._directories = out;
  }
  get directories () { return this.directories }

  /**
   * Load slash commands from a directory
   * @param directory Directory to search for slash commands in
   */
  loadDirectory (directory: string) {
    console.log(`Loading directory: '${directory}'`)
    try { 
      const commandFiles = fs.readdirSync(directory).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

      for (const file of commandFiles) {
        const commandPath = path.join(directory, file);
        try {
          const command = require(commandPath);
          if (command.default.data && command.default.command) {

            const commandName = command.default.data.name;
            this._commands.set(commandName, command.default)
            console.log(`Found and loaded '${commandName}' from '${file}'`)

          } else if (command.data && command.command) {

            const commandName = command.data.name;
            this._commands.set(commandName, command)
            console.log(`Found and loaded '${commandName}' from '${file}'`)

          } else throw new Error(`Found '${file}' but couldn't parse it due to an invalid format.`);

        } catch (err) {
          console.error(`Something went wrong when trying to parse file: '${commandPath}'`)
          console.error(err)
        }
      }
    } catch (err) {
      console.error(`Something went wrong when trying to load directory: '${directory}'`)
      console.error(err)
    }
  }

  /**
   * Load slash commands from cached directories and optionally extra directories
   * @param directories Extra directories to search in
   */
  loadDirectories (directories?: string[]) {
    const toLoad = this._directories;
    if (directories) toLoad.push(...directories);
    for (const dir of toLoad) this.loadDirectory(dir);
  }

  /**
   * Refresh bot command cache on Discord
   * @param global Refresh commands globally
   */
  async refreshCommands (global: boolean): Promise<void> {
    const guild_id = !global ? this._guild_id : undefined
    if (guild_id === undefined && !global) return console.error("Cannot refresh guild commands because a guild ID was not found.\nPlease supply a guild ID or run a global refresh instead.")

    try {
      console.log(`Refreshing ${guild_id ? `(/) commands for guild with id '${guild_id}'` : "global (/) commands"}.`);
  
      const jsonCommands = [];
      for (const [id, command] of this._commands) {
        jsonCommands.push(command.data.toJSON());
      }
  
      await this._rest.put(
        guild_id ? 
          Routes.applicationGuildCommands(this._client_id, guild_id) :
          Routes.applicationCommands(this._client_id),
        { body: jsonCommands },
      );
  
      console.log('Successfully refreshed (/) commands.');
    } catch (error) {
      console.error(error);
    }
  }
}