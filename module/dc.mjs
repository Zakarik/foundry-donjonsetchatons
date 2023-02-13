// Import document classes.
import { DCActor } from "./documents/actor.mjs";
import { DCItem } from "./documents/item.mjs";
// Import sheet classes.
import { DCRelance } from "./sheets/relance-sheet.mjs";
import { DCActorSheet } from "./sheets/actor-sheet.mjs";
import { DCItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { DC } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.dc = {
    applications: {
      DCActorSheet,
      DCItemSheet,
      DCRelance,
    },
    documents:{
      DCActor,
      DCItem
    },
    RollDCMacro
  };

  // Add custom constants for configuration.
  CONFIG.DC = DC;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "0",
    decimals: 2
  };
  // Define custom Document classes
  CONFIG.Actor.documentClass = DCActor;
  CONFIG.Item.documentClass = DCItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  Actors.registerSheet("donjons-et-chatons", DCActorSheet, {
    types: ["chaton"],
    makeDefault: true
  });

  Items.registerSheet("donjons-et-chatons", DCItemSheet, {
    types: ["miagie", "equipement"],
    makeDefault: true
  });

  Handlebars.registerHelper('isTalentChecked', function(root, key) {
    const isCheck = root.systemData.talents[key]?.value || false;

    return isCheck;
  });

  Handlebars.registerHelper('talentQualiteSelected', function(root, key) {
    const selected = root.systemData.talents[key]?.qualite || "";
    return selected;
  });

  Handlebars.registerHelper('oddOrEven', function(type, index) {
    let result = false;

    if(type === 'pair') {
      if(index%2 === 0) result = true;
    } else if(type === 'impair') {
      if(index%2 !== 0) result = true;
    }

    return result;
  });

  Handlebars.registerHelper('isType', function(type, compare) {
    const result = type === compare ? true : false;
    return result;
  });

  Handlebars.registerHelper('translateQualite', function(qualite) {

    const result = qualite === undefined ? "" : game.i18n.localize(`DC.QUALITES.${qualite.charAt(0).toUpperCase()+qualite.substr(1)}`);

    return result;
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (bar, data, slot) => createMacro(bar, data, slot));
});

async function createMacro(bar, data, slot) {
  // Create the macro command

  const label = data.label;
  const istalent = data.istalent;
  const issay = data.issay;
  const actorId = data.actorId;
  const id = data.id;
  const command = `game.dc.RollDCMacro("${actorId}", "${label}", "${istalent}", "${issay}", "${id}");`;

  let img = "";

  if(issay === true) {
    if(id != 0) {
      const item = game.actors.get(actorId).items.find(i => i.id === id);
      img = item.img;
    }
  } else {
    switch(id) {
      case "costaud":
        img = "systems/donjons-et-chatons/assets/icons/D6Costaud.png";
        break;

      case "malin":
        img = "systems/donjons-et-chatons/assets/icons/D6Malin.png";
        break;

      case "mignon":
        img = "systems/donjons-et-chatons/assets/icons/D6Mignon.png";
        break;

      default:
        img = "systems/donjons-et-chatons/assets/icons/D6Black.svg";
        break;
    }
  }

  let macro = await Macro.create({
    name: label,
    type: "script",
    img: img,
    command: command,
    flags: { "dc.attributMacro": true }
  });
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

async function RollDCMacro(actorid, label, istalent, issay, id) {
  const speaker = ChatMessage.getSpeaker();

  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  if (!actor) actor = game.actors.get(actorid);

  const data = actor.system;

  let labelFinal = label;
  let description = '';
  let value = 0;
  let dataTemplate = {};

  if(istalent === "true") {
    const nQualite = data.talents[id].qualite;
    const vQualite = data.qualites;

    if(nQualite === '') return;

    switch(nQualite) {
      case 'costaud':
        labelFinal = `${label} (${game.i18n.localize(`DC.QUALITES.Costaud`)})`;
        value = vQualite.costaud;
        break;

      case 'malin':
        labelFinal = `${label} (${game.i18n.localize(`DC.QUALITES.Malin`)})`;
        value = vQualite.malin;
        break;

      case 'mignon':
        labelFinal = `${label} (${game.i18n.localize(`DC.QUALITES.Mignon`)})`;
        value = vQualite.mignon;
        break;
    }

    dataTemplate = {
      label: `${labelFinal} : ${game.i18n.localize(`DC.ROLL.ASK.Type`)} ?`,
      options:
      `<option value="">${game.i18n.localize(`DC.ROLL.ASK.Standard`)}</option> <option value="avantage" selected>${game.i18n.localize(`DC.ROLL.ASK.Avantage`)}</option> <option value="desavantage">${game.i18n.localize(`DC.ROLL.ASK.Desavantage`)}</option>`
    };
  } else if(issay === "true") {
    const item = game.actors.get(actorid).items.find(i => i.id === id);

    labelFinal = item.name;
    description = item.system.description;
  } else {
    value = +data.qualites[id];

    dataTemplate = {
      label: `${labelFinal} : ${game.i18n.localize(`DC.ROLL.ASK.Type`)} ?`,
      options:
      `<option value="">${game.i18n.localize(`DC.ROLL.ASK.Standard`)}</option> <option value="avantage">${game.i18n.localize(`DC.ROLL.ASK.Avantage`)}</option> <option value="desavantage">${game.i18n.localize(`DC.ROLL.ASK.Desavantage`)}</option>`
    };
  }

  if(issay === "true") {
    const msgData = {
      label:`${labelFinal}`,
      description:`${description}`
    };

    const msg = {
      user: game.user.id,
      speaker: {
        actor: actor?.id || null,
        token: actor?.token?.id || null,
        alias: actor?.name || null,
      },
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: await renderTemplate('systems/donjons-et-chatons/templates/msg/item.html', msgData)
    };

    const rMode = game.settings.get("core", "rollMode");
    const msgFData = ChatMessage.applyRollMode(msg, rMode);

    await ChatMessage.create(msgFData, {
      rollMode:rMode
    });
  } else {
    const dialogTemplate = await renderTemplate("systems/donjons-et-chatons/templates/dialog/ask.html", dataTemplate);
    const dialogOptions = {
      classes: ["dcaskroll"],
    };

    let d = new Dialog({
    title: `${game.i18n.localize(`DC.ROLL.ASK.Type`)}`,
    content:dialogTemplate,
    buttons: {
      one: {
      icon: '<i class="fas fa-check"></i>',
      label: `${game.i18n.localize(`DC.ROLL.ASK.Roll`)}`,
      callback: async (event) => {
          const result = $(event.find('.choice'))[0].value;
          let name = `${labelFinal}`;
          let roll = `3D6`;
          let formula = `3D6<=${value}`;
          let numDice = 3;

          switch(result) {
            case 'avantage':
              name += `<br/>${game.i18n.localize(`DC.ROLL.wAvantage`)}`;
              roll = `4D6`;
              formula = `4D6<=${value}`;
              numDice = 4;
              break;
            case 'desavantage':
              name += `<br/>${game.i18n.localize(`DC.ROLL.wDesavantage`)}`;
              roll = `2D6`;
              formula = `2D6<=${value}`;
              numDice = 2;
              break;
          }

          let r = new Roll(`${roll}cs<=${value}`);

          await r.evaluate({async:true});

          let dices = [];

          for(let i = 0;i < r.dice[0].results.length;i++) {
            const dS = r.dice[0].results[i];

            if(dS.success) {
              dices.push(`<li class="roll die d6 success" data-num="${i}">${dS.result}</li>`);
            } else {
              dices.push(`<li class="roll die d6" data-num="${i}">${dS.result}</li>`);
            }
          }

          const tooltip = `
          <div class="dice-tooltip">
            <section class="tooltip-part">
                <div class="dice">
                    <header class="part-header flexrow">
                        <span class="part-formula">${formula}</span>

                        <span class="part-total">${r._total}</span>
                    </header>
                    <ol class="dice-rolls">
                        ${dices.join(' ')}
                    </ol>
                </div>
            </section>
          </div>`;

          const data = {
            flavor:`${name}`,
            main:{
              total:r._total,
              tooltip:tooltip
            }
          };

          const msgData = {
            user: game.user.id,
            speaker: {
              actor: actor?.id || null,
              token: actor?.token?.id || null,
              alias: actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: await renderTemplate('systems/donjons-et-chatons/templates/msg/roll.html', data),
            sound: CONFIG.sounds.dice
          };

          const rMode = game.settings.get("core", "rollMode");
          const msgTotalData = ChatMessage.applyRollMode(msgData, rMode);

          const msg = await ChatMessage.create(msgTotalData, {
            rollMode:rMode
          });

          if(r._total < numDice) new DCRelance(name, actor, value, result, msg.id, dices, formula, r._total).render(true);
        }
      },
      two: {
      icon: '<i class="fas fa-times"></i>',
      label: `${game.i18n.localize(`DC.ROLL.ASK.Cancel`)}`,
      callback: () => {}
      }
    },
    default: "two",
    dialogOptions
    },
    dialogOptions);
    d.render(true);
  }
}