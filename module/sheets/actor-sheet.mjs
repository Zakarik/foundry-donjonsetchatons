import { DCRelance } from "./relance-sheet.mjs";

/**
 * @extends {ActorSheet}
 */
export class DCActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["chaton", "sheet", "actor"],
      template: "systems/donjons-et-chatons/templates/actor-sheet.html",
      width: 850,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "talents"}],
      dragDrop: [{dragSelector: ".draggable", dropSelector: null}],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();

    const listTalents = CONFIG.DC.talents;

    let listTalentsUpdated = {};

    for(let i = 0;i < listTalents.length;i++) {
      listTalentsUpdated[listTalents[i]] = game.i18n.localize(`DC.TALENTS.${listTalents[i]}`);
    }

    context.actor.talents = listTalentsUpdated;

    this._prepareCharacterItems(context);

    context.systemData = context.data.system;

    return context;
  }

  /**
     * Return a light sheet if in "limited" state
     * @override
     */
   get template() {
    if (!game.user.isGM && this.actor.limited) {
      return "systems/donjons-et-chatons/templates/limited-sheet.html";
    }
    return this.options.template;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    html.find('img.d6roll').mouseenter(ev => {
      $(ev.currentTarget).attr('src', 'systems/donjons-et-chatons/assets/icons/D6White.svg');
    });

    html.find('img.d6roll').mouseleave(ev => {
      $(ev.currentTarget).attr('src', 'systems/donjons-et-chatons/assets/icons/D6Black.svg');
    });

    html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find('.item-edit').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      item.sheet.render(true);
    });

    html.find('.item-delete').click(async ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      item.delete();
      header.slideUp(200, () => this.render(false));
    });

    html.find('.item-dialog').click(async ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      const msgData = {
        label:`${item.name}`,
        description:`${item.system.description}`
      };

      const msg = {
        user: game.user.id,
        speaker: {
          actor: this.actor?.id || null,
          token: this.actor?.token?.id || null,
          alias: this.actor?.name || null,
        },
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: await renderTemplate('systems/donjons-et-chatons/templates/msg/item.html', msgData)
      };

      const rMode = game.settings.get("core", "rollMode");
      const msgFData = ChatMessage.applyRollMode(msg, rMode);

      await ChatMessage.create(msgFData, {
        rollMode:rMode
      });
    });

    html.find('label.roll').click(async ev => {
      const target = $(ev.currentTarget);
      const label = target.data("label");
      const value = target.data("value");

      const dataTemplate = {
        label: `${label} : ${game.i18n.localize(`DC.ROLL.ASK.Type`)} ?`,
        options:
        `<option value="">${game.i18n.localize(`DC.ROLL.ASK.Standard`)}</option> <option value="avantage">${game.i18n.localize(`DC.ROLL.ASK.Avantage`)}</option> <option value="desavantage">${game.i18n.localize(`DC.ROLL.ASK.Desavantage`)}</option>`
      };
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
              let name = `${label}`;
              let roll = `3D6`;
              let numDice = 3;

              switch(result) {
                case 'avantage':
                  name += `<br/>${game.i18n.localize(`DC.ROLL.wAvantage`)}`;
                  roll = `4D6`;
                  numDice = 4;
                  break;
                case 'desavantage':
                  name += `<br/>${game.i18n.localize(`DC.ROLL.wDesavantage`)}`;
                  roll = `2D6`;
                  numDice = 2;
                  break;
              }

              let r = new game.dc.DCRoll(this.actor, name, result);
              r.difficulte = parseInt(value);
              await r.doRoll(roll);
              r.sendMsg();
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
    });

    html.find('img.rolltalent').click(async ev => {
      const data = this.getData();
      const target = $(ev.currentTarget);
      const talent = target.data("talent");
      const nTalent = target.data("label");
      const nQualite = data.systemData.talents[talent].qualite;
      const vQualite = data.systemData.qualites;

      let label = '';
      let value = 0;

      if(nQualite === '') return;

      switch(nQualite) {
        case 'costaud':
          label = `${nTalent} (${game.i18n.localize(`DC.QUALITES.Costaud`)})`;
          value = vQualite.costaud;
          break;

        case 'malin':
          label = `${nTalent} (${game.i18n.localize(`DC.QUALITES.Malin`)})`;
          value = vQualite.malin;
          break;

        case 'mignon':
          label = `${nTalent} (${game.i18n.localize(`DC.QUALITES.Mignon`)})`;
          value = vQualite.mignon;
          break;
      }

      const dataTemplate = {
        label: `${label} : ${game.i18n.localize(`DC.ROLL.ASK.Type`)} ?`,
        options:
        `<option value="">${game.i18n.localize(`DC.ROLL.ASK.Standard`)}</option> <option value="avantage" selected>${game.i18n.localize(`DC.ROLL.ASK.Avantage`)}</option> <option value="desavantage">${game.i18n.localize(`DC.ROLL.ASK.Desavantage`)}</option>`
      };
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
              let name = `${label}`;
              let roll = `3D6`;
              let numDice = 3;

              switch(result) {
                case 'avantage':
                  name += `<br/>${game.i18n.localize(`DC.ROLL.wAvantage`)}`;
                  roll = `4D6`;
                  numDice = 4;
                  break;
                case 'desavantage':
                  name += `<br/>${game.i18n.localize(`DC.ROLL.wDesavantage`)}`;
                  roll = `2D6`;
                  numDice = 2;
                  break;
              }

              let r = new game.dc.DCRoll(this.actor, name, result);
              r.difficulte = parseInt(value);
              await r.doRoll(roll);
              r.sendMsg();
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

      /**/
      //game.messages.get(msg._id);
    });
  }

  /* -------------------------------------------- */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    const miagie = [];
    const equipement = [];

    for (let i of sheetData.items) {
      // MIAGIE.
      if (i.type === 'miagie') {
        miagie.push(i);
      }
      // EQUIPEMENT.
      if (i.type === 'equipement') {
        equipement.push(i);
      }
    }

    actorData.miagie = miagie;
    actorData.equipement = equipement;
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `${game.i18n.localize(`TYPES.Item.${type}`)}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };

    switch(type) {
      case "equipement":
          itemData.img = "systems/donjons-et-chatons/assets/icons/Equipement.svg";
          break;

      case "miagie":
          itemData.img = "systems/donjons-et-chatons/assets/icons/Miagie.svg";
          break;
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  _onDragStart(event) {
    const li = event.currentTarget;

    if ( event.target.classList.contains("content-link") ) return;

    const label = $(li)?.data("label") || "";
    const istalent = $(li)?.data("istalent") || false;
    const issay = $(li)?.data("issay") || false;
    const id = $(li)?.data('id')

    // Create drag data
    const dragData = {
      actorId: this.actor.id,
      sceneId: this.actor.isToken ? canvas.scene?.id : null,
      tokenId: this.actor.isToken ? this.actor.token.id : null,
      label:label,
      istalent:istalent,
      issay:issay,
      id:id,
      itemId:$(li)?.data("itemid") || 0
    };

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
}