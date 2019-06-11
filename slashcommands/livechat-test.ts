import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { LivechatExampleApp } from '../LivechatExampleApp';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

export class LivechatTest implements ISlashCommand {
    public command = 'livechat-test';
    public i18nParamsExample = 'livechat';
    public i18nDescription = 'livechat';
    public providesPreview = false;

    constructor(private readonly app: LivechatExampleApp) { }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const [command] = context.getArguments();

        switch (command) {
            case 'visitor':
                await this.sendVisitorMessageInLivechatRoom(read, modify);
                break;

            case 'register':
                await this.registerVisitor(context, read, modify);
                break;

            case 'transfer':
                await this.transferVisitor(context, read, modify);
                break;

            case 'close':
                await this.closeRoom(context, read, modify);
                break;
        }
    }

    private async sendVisitorMessageInLivechatRoom(read: IRead, modify: IModify) {
        const [visitor] = await read.getLivechatReader().getLivechatVisitors({_id : 'LT7aQZvndGvy4si7r'});
        const [room] = await read.getLivechatReader().getLivechatRooms(visitor);

        if (!visitor) {
            throw new Error('Error');
        }

        const livechat = modify.getCreator().startLivechatMessage()
            .setVisitor(visitor)
            .setRoom(room)
            .setText('Alo');

        modify.getCreator().finish(livechat);
    }

    private async registerVisitor(context: SlashCommandContext, read: IRead, modify: IModify) {
        const token = modify.getCreator().getLivechatCreator().createToken();
        const visitor = {
            name: 'Douglas Visitor' + token,
            token,
            updatedAt: new Date(),
            username: 'guest-95',
            visitorEmails: [
                {
                    address: 'douglas.gubert@rocket.chat.' + token,
                },
            ],
        } as IVisitor;

        visitor.id = await modify.getCreator().getLivechatCreator().createVisitor(visitor);

        let [room] = await read.getLivechatReader().getLivechatRooms(visitor);

        if (!room) {
            room = await modify.getCreator().getLivechatCreator().createRoom(visitor, context.getSender());
        }

        const livechat = modify.getCreator().startLivechatMessage()
            .setVisitor(visitor)
            .setRoom(room)
            .setText('Alo');

        modify.getCreator().finish(livechat);
    }

    private async transferVisitor(context: SlashCommandContext, read: IRead, modify: IModify) {
        const [visitor] = await read.getLivechatReader().getLivechatVisitors({token:'xqf3vor80ag1jquf9qzge3'});
        const [currentRoom] = await read.getLivechatReader().getLivechatRooms(visitor);

        const result = await modify.getUpdater().getLivechatUpdater().transferVisitor(visitor, {
            currentRoom,
            targetAgent: await read.getUserReader().getByUsername('dglivechat'),
        });

        const msg = modify.getCreator().startMessage({
            room: context.getRoom(),
            sender: await read.getUserReader().getByUsername('rocket.cat'),
        });

        if (result) {
            msg.setText('Transfer successfull');
        } else {
            msg.setText('Transfer not successfull');
        }

        modify.getNotifier().notifyUser(context.getSender(), msg.getMessage());
    }

    private async closeRoom(context: SlashCommandContext, read: IRead, modify: IModify) {
        const [visitor] = await read.getLivechatReader().getLivechatVisitors({username:'guest-95'});
        const [currentRoom] = await read.getLivechatReader().getLivechatRooms(visitor);

        const result = await modify.getUpdater().getLivechatUpdater().closeRoom(currentRoom, 'Slashcommand closed');

        const msg = modify.getCreator().startMessage({
            room: context.getRoom(),
            sender: await read.getUserReader().getByUsername('rocket.cat'),
        });

        if (result) {
            msg.setText('Close successfull');
        } else {
            msg.setText('Close not successfull');
        }

        modify.getNotifier().notifyUser(context.getSender(), msg.getMessage());
    }
}
