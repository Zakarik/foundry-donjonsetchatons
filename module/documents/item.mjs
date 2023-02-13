/**
 * Extend the base Item document to support attributes and groups with a custom template creation dialog.
 * @extends {Item}
 */
export class DCItem extends Item {
    static async create(data, options = {}) {
        // Replace default image
        if (data.img === undefined) {

            switch(data.type) {
                case "equipement":
                    data.img = "systems/donjons-et-chatons/assets/icons/Equipement.svg";
                    break;

                case "miagie":
                    data.img = "systems/donjons-et-chatons/assets/icons/Miagie.svg";
                    break;
            }
        }

        await super.create(data, options);
    }
}
