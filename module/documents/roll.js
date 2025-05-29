/**
 * An interface and API for constructing and evaluating dice rolls.
 * The basic structure for a dice roll is a string formula and an object of data against which to parse it.
 *
 * @param {string} formula    The string formula to parse
 * @param {object} data       The data object against which to parse attributes within the formula
 *
 * @example Attack with advantage
 * ```js
 * // Construct the Roll instance
 * let r = new Roll("2d20kh + @prof + @strMod", {prof: 2, strMod: 4});
 *
 * // The parsed terms of the roll formula
 * console.log(r.terms);    // [Die, OperatorTerm, NumericTerm, OperatorTerm, NumericTerm]
 *
 * // Execute the roll
 * await r.evaluate();
 *
 * // The resulting equation after it was rolled
 * console.log(r.result);   // 16 + 2 + 4
 *
 * // The total resulting from the roll
 * console.log(r.total);    // 22
 * ```
 */
export default class DCRoll {

  constructor(actor, label) {
      this._actor = actor;
      this._results = null;
      this._roll = null;
      this._type = null;
      this._label = label;
  }
  /**
   * The HTML template path used to render a complete Roll object to the chat log
   * @type {string}
   */
  static CHAT_TEMPLATE = "systems/donjons-et-chatons/templates/msg/roll.html";

  get actor() {
    return this._actor;
  }

  set actor(value) {
    this._actor = value;
  }

  get results() {
    return this._results;
  }

  set results(value) {
    this._results = value;
  }

  get roll() {
    return this._roll;
  }

  set roll(value) {
    this._roll = value;
  }

  get label() {
    return this._label;
  }

  get dices() {
      return this._dices;
  }

  set dices(value) {
      this._dices = value;
  }

  set label(value) {
    this._label = value;
  }

  get difficulte() {
    return this._difficulte;
  }

  set difficulte(value) {
    this._difficulte = value;
  }

  get type() {
    return this._type;
  }

  set type(value) {
    this._type = value;
  }

  async doRoll(dices, type) {
    const difficulte = this.difficulte;
    const roll = new Roll(dices);
    await roll.evaluate();

    const listDices = roll.dice[0].results;
    let allDice = [];
    let success = 0;

    for(let d of listDices) {
        if(d.active && d.result <= difficulte) success += 1;
        allDice.push(d)
    }

    this.dices = allDice;
    this.roll = roll;
    this.results = success;
    this.type = type;
  }

  async sendMsg() {
      const chatRollMode = game.settings.get("core", "rollMode");
      let main = {};
      main.label = this.label;
      main.tooltip = await this.roll.getTooltip();
      main.total = this.results;

      let chatData = {
          user:game.user.id,
          speaker: {
              actor: this.actor?.id ?? null,
              token: this.actor?.token ?? null,
              alias: this.actor?.name ?? null,
              scene: this.actor?.token?.parent?.id ?? null
          },
          content:await renderTemplate(this.constructor.CHAT_TEMPLATE, main),
          flags:{
            "donjons-et-chatons":{
              roll:{
                difficulte:this.difficulte,
                dices:this.dices,
                results:this.results,
              }
            }
          },
          sound: CONFIG.sounds.dice,
          rolls:this.roll,
          rollMode:chatRollMode,
      };

      ChatMessage.applyRollMode(chatData, chatRollMode);
      const msg = await ChatMessage.create(chatData);
      if(game.dice3d) {
        game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(()=> this.postRoll(msg));
      } else {
        this.postRoll(msg);
      }

  }

  async postRoll(msg) {
    let r = new game.dc.DCRelance(this.label, this.actor, this.difficulte, this.type, msg.id, this.roll);
    const rolls = this.roll.dice[0].getTooltipData().rolls;
    const dices = [];

    for(let i = 0;i < rolls.length;i++) {
      dices.push(`<li class="roll ${rolls[i].classes}" data-num="${i}">${rolls[i].result}</li>`);
    }
    await r.setDices(dices);
    r.render(true);
  }

  /*async editRoll(num, value) {
    const template = this.dice[0].getTooltipData().rolls[num];

    this.options = foundry.utils.mergeObject({
      DCOld:`<li class="roll ${template.classes}">${template.result}</li>`
    }, this.options);

    this.dice[0].results[num] = value.results[0];

    if(value.results[0].success) this._total += 1;
  }*/
}
