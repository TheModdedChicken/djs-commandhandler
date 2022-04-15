import { SlashCommandBuilder } from "@discordjs/builders"
import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, ContextMenuInteraction, MessageContextMenuInteraction, UserContextMenuInteraction } from "discord.js"

export default interface ISlashCommand {
  data: SlashCommandBuilder
  command: (interaction: CommandInteraction) => Promise<void>
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>
  button?: (interaction: ButtonInteraction) => Promise<void>
  contextMenu?: (interaction: ContextMenuInteraction) => Promise<void>
  messageContextMenu?: (interaction: MessageContextMenuInteraction) => Promise<void>
  userContextMenu?: (interaction: UserContextMenuInteraction) => Promise<void>
}