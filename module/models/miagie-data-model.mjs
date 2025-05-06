export class MiagieDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {StringField, NumberField, HTMLField} = foundry.data.fields;
        let data = {
            description:new HTMLField({initial:""}),
            qualite:new StringField({initial:""}),
            succes:new NumberField({initial:1}),
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