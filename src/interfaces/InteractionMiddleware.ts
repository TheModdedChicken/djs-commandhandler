import { Interaction } from "discord.js";

export default interface IInteractionMiddleware {
  (interaction: Interaction, stop: () => void): void
}