import { GuildMember } from "discord.js"

export function hasTrustedRole(guildMember: GuildMember) {
    return guildMember.roles.cache.has(process.env.DISCORD_TRUSTED_ROLE_ID) 
}

export function isOpUser(discordUserID: String) {
    return discordUserID == process.env.DISCORD_OP_USER_ID
}