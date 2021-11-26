import { Channel, Message, TextChannel } from 'discord.js';
import { createMock } from "ts-auto-mock";

import events from "../../src/events";
import CoinModule from '../../src/modules/CoinModule';

const sut = new CoinModule();

beforeEach(() => {
    sut.registerModule()
});

afterEach(() => {
    sut.unregisterModule()
});

test('Flipping a coin returns Lucky or Unlucky.', () => {
    sut.getRandomIntInclusive = () => {
        return 1;
    }

    const messageMock: Message = createMock<Message>({channel: createMock<TextChannel>()});
    
    messageMock.channel.send = jest.fn().mockImplementation()

    events.emitDiscordCommand(messageMock, "flip", [])

    expect(messageMock.channel.send).toHaveBeenCalledTimes(1)
    expect(messageMock.channel.send).toBeCalledWith("You flipped a coin, it landed on the **Lucky** side.")
});