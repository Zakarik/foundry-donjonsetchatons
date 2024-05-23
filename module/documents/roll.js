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
export class DCRoll extends Roll {

  /**
   * The HTML template path used to render a complete Roll object to the chat log
   * @type {string}
   */
  static CHAT_TEMPLATE = "systems/donjons-et-chatons/templates/msg/roll.html";

  /* -------------------------------------------- */

  /**
   * Render a Roll instance to HTML
   * @param {object} [options={}]               Options which affect how the Roll is rendered
   * @param {string} [options.flavor]             Flavor text to include
   * @param {string} [options.template]           A custom HTML template path
   * @param {boolean} [options.isPrivate=false]   Is the Roll displayed privately?
   * @returns {Promise<string>}                 The rendered HTML template as a string
   */
  async render({flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {
    if ( !this._evaluated ) await this.evaluate({async: true});
    const options = this.options;
    const DCFlavor = options.flavor ? options.flavor : flavor;
    const DCRoll = options.DCRoll ? options.DCRoll : false;
    const DCOld = options.DCOld ? options.DCOld : false;

    const chatData = {
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : DCFlavor,
      DCRoll:DCRoll,
      DCOld:DCOld,
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100
    };
    return renderTemplate(template, chatData);
  }

  async editRoll(num, value) {
    const template = this.dice[0].getTooltipData().rolls[num];

    this.options = foundry.utils.mergeObject({
      DCOld:`<li class="roll ${template.classes}">${template.result}</li>`
    }, this.options);

    this.dice[0].results[num] = value.results[0];

    if(value.results[0].success) this._total += 1;
  }
}
