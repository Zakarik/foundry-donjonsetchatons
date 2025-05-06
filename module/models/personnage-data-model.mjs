export class DCDataModel extends foundry.abstract.TypeDataModel {
	static defineSchema() {
		const {SchemaField, StringField, NumberField, BooleanField, HTMLField} = foundry.data.fields;
        const listTalents = CONFIG.DC.talents;
        let talents = {}

        for(let t of listTalents) {
            talents[t] = new SchemaField({
                value:new BooleanField({initial:false}),
                qualite:new StringField({initial:""}),
            })
        }

        let data = {
            don:new StringField({initial:""}),
            enfance:new StringField({initial:""}),
            caractere:new StringField({initial:""}),
            description:new HTMLField({initial:""}),
            historique:new HTMLField({initial:""}),
            experience:new SchemaField({
              actuelle:new NumberField({initial:0}),
              totale:new NumberField({initial:0}),
            }),
            qualites:new SchemaField({
              costaud:new NumberField({initial:0}),
              malin:new NumberField({initial:0}),
              mignon:new NumberField({initial:0}),
            }),
            coeur:new SchemaField({
              value:new NumberField({initial:0}),
              max:new NumberField({initial:0}),
            }),
            amitie:new SchemaField({
              value:new NumberField({initial:0}),
              max:new NumberField({initial:0}),
            }),
            talents:new SchemaField(talents),
        }

		return data;
	}

	_initialize(options = {}) {
		super._initialize(options);
	}

    get actor() {
        return this.parent;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {
        const costaud = this.qualites.costaud;
        const malin = this.qualites.malin;
        const mignon = this.qualites.mignon;
        Object.defineProperty(this.coeur, 'max', {
            value: costaud+malin,
            writable:true,
            enumerable:true,
            configurable:true
        });

        Object.defineProperty(this.amitie, 'max', {
            value: mignon,
            writable:true,
            enumerable:true,
            configurable:true
        });
    }

    static migrateData(source) {
        return super.migrateData(source);
    }
}