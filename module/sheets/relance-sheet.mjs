export class DCRelance extends FormApplication  {
    constructor(name, actor, value, type, msg, dices, formula, result) {
        super();

        this.object.name = name;
        this.object.actor = actor;
        this.object.value = value;
        this.object.type = type;
        this.object.msg = msg;
        this.object.dices = dices;
        this.object.formula = formula;
        this.object.result = result;
        this.object.selected = null;
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

        context.object.results = context.object.dices.join(' ');
        console.log(context);

        return context;
    }

    /** @inheritdoc */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('li.roll').click(ev => {
            const num = $(ev.currentTarget).data("num");
            const dices = this.object.dices;

            for(let i = 0;i < dices.length;i++) {
                this.object.dices[i] = dices[i].replace('roll selected', 'roll');

                if(num === i) {
                    this.object.dices[i] = dices[i].replace('roll', 'roll selected');
                    this.object.selected = i;
                }
            }
            this.render(true);
        });

        html.find('button.relance').click(async ev => {
            const name = this.object.name;
            const selected = this.object.selected;
            const formula = this.object.formula;
            let result = this.object.result;

            if(selected === null) return;

            game.messages.get(this.object.msg).delete();

            let r = new Roll(`1D6cs<=${this.object.value}`);

            await r.evaluate({async:true});

            const replaced = this.object.dices[selected];

            this.object.dices.splice(selected, 1);

            const newDice = this.object.dices;

            if(r.dice[0].results[0].success) {
                newDice.push(`<li class="roll die d6 success">${r.dice[0].values[0]}</li>`);
            } else {
                newDice.push(`<li class="roll die d6">${r.dice[0].values[0]}</li>`);
            }

            result += r._total;

            const tooltip = `
              <div class="dice-tooltip">
                <section class="tooltip-part">
                    <div class="dice">
                        <header class="part-header flexrow">
                            <span class="part-formula">${formula}</span>

                            <span class="part-total">${result}</span>
                        </header>
                        <ol class="dice-rolls">
                            ${newDice.join(' ')}
                        </ol>
                    </div>
                </section>
              </div>`;

              const data = {
                flavor:`${name} (relancé)`,
                main:{
                  total:result,
                  tooltip:tooltip,
                  relance:true,
                  old:replaced
                }
              };

              const msgData = {
                user: game.user.id,
                speaker: {
                  actor: this.object.actor?.id || null,
                  token: this.object.actor?.token?.id || null,
                  alias: this.object.actor?.name || null,
                },
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                content: await renderTemplate('systems/donjons-et-chatons/templates/msg/roll.html', data),
                sound: CONFIG.sounds.dice
              };

              const rMode = game.settings.get("core", "rollMode");
              const msgTotalData = ChatMessage.applyRollMode(msgData, rMode);

              await ChatMessage.create(msgTotalData, {
                rollMode:rMode
              });
        });
    }

    async _updateObject(event, formData) {

    }
}