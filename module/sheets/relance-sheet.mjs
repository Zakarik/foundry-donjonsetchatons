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

    static CHAT_TEMPLATE = "systems/donjons-et-chatons/templates/msg/roll.html";

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
            const getMsg = game.messages.get(this.object.msg);
            let result = this.object.result;

            if(selected === undefined || !getMsg) return;
            const roll = this.object.roll;
            const difficulte = this.object.value;
            let getData = getMsg.getFlag("donjons-et-chatons", "roll");
            let r = new Roll(`1D6`);
            await r.evaluate();
            const tooltip = await r.getTooltip();
            let oldTooltip = await roll.getTooltip();
            let flags = getData;

            if(r.total <= difficulte) {
              flags.results += 1;
            }

            const dices = flags.dices;
            dices[selected].active = false;
            dices.push({
              result:r.total,
              active:true,
            })

            if(dices[selected].result <= difficulte) {
              flags.results -= 1;
            }
            let l = 0;
            let n = 0;
            let split = oldTooltip.split('\n');
            let old = '';

            for(let t of split) {
              if(t.includes('<li class=\"roll') && n === selected) {
                old = split[l];
                split[l] = split[l].replace('d6', 'd6 discarded');
                break;
              } else if(t.includes('<li class=\"roll')) n += 1;

              l += 1;
            }

            let main = {};
            main.label = this.object.name;
            main.tooltip = `${split.join('\n')}${tooltip}`;
            main.total = flags.results;
            main.DCOld = old;
            game.messages.get(this.object.msg).delete();

            const chatRollMode = game.settings.get("core", "rollMode");

            let chatData = {
                user:game.user.id,
                speaker: {
                  actor: this.object.actor?.id || null,
                  token: this.object.actor?.token?.id || null,
                  alias: this.object.actor?.name || null,
                },
                content:await renderTemplate(this.constructor.CHAT_TEMPLATE, main),
                flags:{
                  "donjons-et-chatons":{
                    roll:flags
                  }
                },
                sound: CONFIG.sounds.dice,
                rolls:r,
                rollMode:chatRollMode,
            };

            const msg = await ChatMessage.create(chatData);
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