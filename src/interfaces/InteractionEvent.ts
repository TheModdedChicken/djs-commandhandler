import { Interaction } from "discord.js"

export interface IInteractionEvents {
  interactionSuccess: IInteractionEventFunction[]
  interactionFailed: IInteractionEventFunction[]
}

export interface IInteractionEventFunction {
  (interaction?: Interaction, error?: unknown): void
}