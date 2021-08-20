export default interface IModule {
    registerModule(): void
    unregisterModule(): void
    getHelpText(): string
}