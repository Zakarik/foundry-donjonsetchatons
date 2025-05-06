export default class HooksDC {
    static async init() {
        //DEBUT GESTION MESSAGES
        Hooks.on("renderChatMessage", (message, html, messageData) => {
            const tgt = $(html);
            const flags = message.getFlag("donjons-et-chatons", "roll");

            if(flags) {
                tgt.find('.message-content div.dice-result').click(ev => {
                    const header = $(ev.currentTarget).parents('.dice-roll');
                    header.toggleClass('expanded');
                });
            }
        });
    }
}