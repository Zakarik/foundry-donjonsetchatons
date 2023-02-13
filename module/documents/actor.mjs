/**
 * Extend the base Actor document to support attributes and groups with a custom template creation dialog.
 * @extends {Actor}
 */
export class DCActor extends Actor {

  /**
     * Create a new entity using provided input data
     * @override
     */
  static async create(data, options = {}) {
    // Replace default image
    if (data.img === undefined) {
        data.img = "systems/donjons-et-chatons/assets/icons/Chaton.svg";
    }
    await super.create(data, options);
  }

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  prepareDerivedData() {
    const actorData = this;

    this._prepareChatonData(actorData);
  }

  _prepareChatonData(actorData) {
    if (actorData.type !== 'chaton') return;

    const data = actorData.system;
    const costaud = data.qualites.costaud;
    const malin = data.qualites.malin;
    const mignon = data.qualites.mignon;

    data.coeur.max = costaud+malin;
    data.amitie.max = mignon;
  };
}