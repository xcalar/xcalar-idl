class ProjectOpPanelModel extends BaseOpPanelModel {
    public derivedList: ProjectOpPanelModelColumnInfo[] = [];
    public prefixedList: ProjectOpPanelModelPrefixColumn[] = [];
    public columnMap: Map<string, ProgCol> = new Map();

    public static fromDag(dagNode: DagNodeProject) {
        try {
            const allColMap: Map<string, ProgCol> = this.getColumnsFromDag(dagNode);
            return this.fromDagInput(allColMap, dagNode.getParam());
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    public static fromDagInput(
        colMap: Map<string, ProgCol>,
        dagInput: DagNodeProjectInputStruct
    ) {
        const model = new ProjectOpPanelModel();
        model.columnMap = colMap;

        const projectedColumns = dagInput.columns.reduce( (res, col) => {
            res[col] = true;
            return res;
        }, {});

        const prefixLookupMap = {};
        for (const [colName, colInfo] of colMap.entries()) {
            const isSelected = projectedColumns[colName] ? true : false;
            delete projectedColumns[colName]; // remove found ones so at the
            // end we can see which columns were not included in the map
            if (colInfo.prefix == null || colInfo.prefix.length === 0) {
                // Derived column
                model.derivedList.push({
                    name: colName,
                    isSelected: isSelected
                });
            } else {
                // Prefixed column
                const prefix = colInfo.prefix;
                let prefixIndex = prefixLookupMap[prefix];
                if (prefixIndex == null) {
                    model.prefixedList.push({
                        prefix: prefix,
                        isSelected: isSelected,
                        columnList: []
                    });
                    prefixIndex = model.prefixedList.length - 1;
                    prefixLookupMap[prefix] = prefixIndex;
                }
                model.prefixedList[prefixIndex].columnList.push({
                    name: colName,
                    isSelected: false // Not used for prefixed column
                });
            }
        }

        for (let name in projectedColumns) {
            const colInfo = xcHelper.parsePrefixColName(name);
            if (colInfo.prefix == null || colInfo.prefix.length === 0) {
                model.derivedList.push({
                    name: name,
                    isSelected: true
                });
            } else {
                const prefix = colInfo.prefix;
                let prefixIndex = prefixLookupMap[prefix];
                if (prefixIndex == null) {
                    model.prefixedList.push({
                        prefix: prefix,
                        isSelected: true,
                        columnList: []
                    });
                    prefixIndex = model.prefixedList.length - 1;
                    prefixLookupMap[prefix] = prefixIndex;
                }
                model.prefixedList[prefixIndex].columnList.push({
                    name: name,
                    isSelected: false // Not used for prefixed column
                });
            }
        }

        return model;
    }

    public toDag(): DagNodeProjectInputStruct {
        const dagData = { columns: [] };
        for (const colInfo of this.derivedList) {
            if (colInfo.isSelected) {
                dagData.columns.push(colInfo.name);
            }
        }
        for (const group of this.prefixedList) {
            if (group.isSelected) {
                for (const colInfo of group.columnList) {
                    dagData.columns.push(colInfo.name);
                }
            }
        }

        return dagData;
    }

    public get isAllDerivedSelected(): boolean {
        for (const column of this.derivedList) {
            if (!column.isSelected) {
                return false;
            }
        }
        return true;
    }

    public selectAllDerived(isSelected: boolean) {
        for (const column of this.derivedList) {
            column.isSelected = isSelected;
        }
    }

    public getSelectedCount(): {derived: number, prefixed: number} {
        const derivedCount = this.derivedList.reduce( (res, column) => (
            res + (column.isSelected ? 1 : 0)
        ), 0);
        const prefixedCount = this.prefixedList.reduce( (res, prefix) => (
            res + (prefix.isSelected ? 1 : 0)
        ), 0);
        return { derived: derivedCount, prefixed: prefixedCount };
    }

    public getColumnType(colName: string): ColumnType {
        const col = this.columnMap.get(colName);
        if (col == null) {
            return ColumnType.unknown;
        }
        return col.getType();
    }

    public static refreshColumns(oldModel, dagNode: DagNodeProject) {
        const allColMap = this.getColumnsFromDag(dagNode);
        const dagData = { columns: [] };
        for (const colInfo of oldModel.derivedList) {
            if (colInfo.isSelected && allColMap.has(colInfo.name)) {
                dagData.columns.push(colInfo.name);
            }
        }
        for (const group of oldModel.prefixedList) {
            if (group.isSelected) {
                for (const colInfo of group.columnList) {
                    if (allColMap.has(colInfo.name)) {
                        dagData.columns.push(colInfo.name);
                    }
                }
            }
        }
        const model = this.fromDagInput(allColMap, dagData);
        return model;
    }
}