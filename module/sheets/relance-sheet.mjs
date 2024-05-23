export class DCRelance extends FormApplication  {
    constructor(name, actor, value, type, msg, roll) {
        super();

        this.object.name = name;
        this.object.actor = actor;
        this.object.value = value;
        this.object.type = type;
        this.object.msg = msg;
        this.object.dices = undefined;
        this.object.results = undefined;
        this.object.roll = roll;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          classes: ["dc", "sheet", "relance"],
          template: "systems/donjons-et-chatons/templates/relance-sheet.html",
          title:game.i18n.localize(`DC.ROLL.ASK.Relance`),
          width: 400,
          height: 250,
          dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
        });
      }

    /** @inheritdoc */
    getData() {
        const context = super.getData();

        return context;
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('li.roll').click(async ev => {
            const num = $(ev.currentTarget).data("num");
            const dices = this.object.dices;
            const dice = [];

            for(let i = 0;i < dices.length;i++) {
                dice.push(dices[i].replace('roll selected', 'roll'));

                if(num === i) {
                    dice[i] = dices[i].replace("roll", "roll selected");
                    this.object.selected = i;
                }
            }

            await this.setDices(dice);
            this.render(true);
        });

        html.find('button.relance').click(async ev => {
            const name = this.object.name;
            const selected = this.object.selected;
            const formula = this.object.roll.formula;
            let result = this.object.result;

            if(selected === null) return;

            game.messages.get(this.object.msg).delete();

            let r = new Roll(`1D6cs<=${this.object.value}`);
            await r.evaluate();

            this.object.roll.editRoll(
              selected,
              r.dice[0]
            );

            const msgData = {
              user: game.user.id,
              speaker: {
                actor: this.object.actor?.id || null,
                token: this.object.actor?.token?.id || null,
                alias: this.object.actor?.name || null,
              },
              type: CONST.CHAT_MESSAGE_TYPES.ROLL,
              rolls:[this.object.roll],
              sound: CONFIG.sounds.dice,
              flags:{}
            };

            const cls = getDocumentClass("ChatMessage");
            const chatMsg = new cls(msgData);

            const msg = await cls.create(chatMsg.toObject());
        });
    }

    async _updateObject(event, formData) {

    }

    async setDices(dices) {
      this.object.dices = dices;
      this.object.results = dices.join(' ');

      return new Promise(resolve => {
        setTimeout(() => {
          resolve(
            this.object.dices,
            this.object.results
          );
        }, 0);
      });
    }
}