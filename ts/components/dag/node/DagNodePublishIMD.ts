class DagNodePublishIMD extends DagNode {
    protected input: DagNodePublishIMDInput;

    public constructor(options: DagNodeInfo) {
        super(options);
        this.type = DagNodeType.PublishIMD;
        this.maxChildren = 0;
        this.minParents = 1;
        this.display.icon = "&#xea55;";
        this.input = new DagNodePublishIMDInput(options.input);
    }

    public static readonly specificSchema = {
        "definitions": {},
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "http://example.com/root.json",
        "type": "object",
        "additionalProperties": true,
        "required": [
          "parents"
        ],
        "properties": {
          "parents": {
            "$id": "#/properties/parents",
            "type": "array",
            "maxItems": 1,
            "items": {
              "$id": "#/properties/parents/items",
              "type": "string",
              "pattern": "^(.*)$"
            }
          }
        }
    };

    /**
     * Set dataset node's parameters
     * @param input {DagNodePublishIMDInputStruct}

     */
    public setParam(input: DagNodePublishIMDInputStruct): void {
        this.input.setInput({
            pubTableName: input.pubTableName,
            primaryKeys: input.primaryKeys,
            operator: input.operator
        });
        super.setParam();
    }

    public lineageChange(_columns: ProgCol[]): DagLineageChange {
        return {
            columns: [], // export node no need to know lineage
            changes: []
        }
    }

    /**
     * @override
     */
    protected _genParamHint(): string {
        let hint: string = "";
        const input: DagNodePublishIMDInputStruct = this.getParam();
        if (input.pubTableName) {
            hint = `Publish Table: ${input.pubTableName}`;
        }
        return hint;
    }

    protected _getColumnsUsedInInput() {
        return null;
    }
}