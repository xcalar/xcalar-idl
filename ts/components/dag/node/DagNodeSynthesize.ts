class DagNodeSynthesize extends DagNode {
    public constructor(options: DagNodeInfo) {
        super(options);
        this.minParents = 1;
        this.input = new DagNodeSynthesizeInput(options.input);
        // this.display.icon = "&#xe936;";
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

    public lineageChange(
        _columns: ProgCol[],
        replaceParameters?: boolean
    ): DagLineageChange {
        const columns: ProgCol[] = [];
        const changes: {from: ProgCol, to: ProgCol}[] = [];
        // there should be only one parent
        const parents: DagNode[] = this.getParents();
        const parentColMap = {};
        parents.forEach((parent) => {
            parent.getLineage().getColumns(replaceParameters).forEach((parentCol) => {
                parentColMap[parentCol.backName] = parentCol;
            })
        })
        const renamedColNames = [];
        this.input.getInput(replaceParameters).colsInfo.forEach((colInfo) => {
            const origColName = colInfo.sourceColumn;
            renamedColNames.push(origColName);
            const newColName = colInfo.destColumn;
            const colType = xcHelper.convertFieldTypeToColType(
                                       DfFieldTypeTFromStr[colInfo.columnType]);
            const column = ColManager.newPullCol(newColName, newColName, colType);
            columns.push(column);
            changes.push({
                from: parentColMap[origColName],
                to: column
            });
        });
        for (let key in parentColMap) {
            if (renamedColNames.indexOf(key) === -1) {
                changes.push({
                    from: parentColMap[key],
                    to: null
                });
            }
        }
        return {
            columns: columns,
            changes: changes
        };
    }

    protected _getColumnsUsedInInput(): Set<string> {
        return null;
    }
}