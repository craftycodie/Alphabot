import { Message, TextChannel } from 'discord.js';
import { createMock } from "ts-auto-mock";

import events from "../../src/events";
import DiceModule from "../../src/modules/DiceModule";

const sut = new DiceModule();

beforeEach(() => {
    sut.registerModule()
});

afterEach(() => {
    sut.unregisterModule()
});

test('Rolling a dice returns a random number.', () => {
    sut.getRandomIntInclusive = () => {
        return 5;
    }

    const messageMock: Message = createMock<Message>({channel: createMock<TextChannel>()});
    messageMock.channel.send = jest.fn().mockImplementation()

    events.emitDiscordCommand(messageMock, "roll", ["1d6"])

    expect(messageMock.channel.send).toHaveBeenCalledTimes(1)
    expect(messageMock.channel.send).toBeCalledWith("You rolled a 6-sided dice...\nand got a 5.")
});

test('Rolling a 69 returns nice.', () => {
    sut.getRandomIntInclusive = () => {
        return 69;
    }

    const messageMock: Message = createMock<Message>({channel: createMock<TextChannel>()});
    messageMock.channel.send = jest.fn().mockImplementation()

    events.emitDiscordCommand(messageMock, "roll", ["1d69"])

    expect(messageMock.channel.send).toHaveBeenCalledTimes(1)
    expect(messageMock.channel.send).toBeCalledWith("You rolled a 69-sided dice...\nand got a 69. Nice.")
});

test('Rolling two dice returns two results.', () => {
    sut.getRandomIntInclusive = jest.fn().mockReturnValueOnce(2).mockReturnValueOnce(6)

    const messageMock: Message = createMock<Message>({channel: createMock<TextChannel>()});
    messageMock.channel.send = jest.fn().mockImplementation()

    events.emitDiscordCommand(messageMock, "roll", ["2d6"])

    expect(sut.getRandomIntInclusive).toHaveBeenCalledTimes(2)
    expect(messageMock.channel.send).toHaveBeenCalledTimes(1)
    expect(messageMock.channel.send).toBeCalledWith("You rolled 2 6-sided dice...\nand got a 2 and a 6.")
});