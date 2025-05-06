export class EquipementDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {HTMLField} = foundry.data.fields;
        let data = {
            description:new HTMLField({initial:""}),
        }

		return data;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

    get item() {
        return this.parent;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {
    }

    static migrateData(source) {
        return super.migrateData(source);
    }
}