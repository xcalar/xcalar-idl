class DFLinkOutOpPanelModel {
    protected dagNode: DagNode;
    protected tableColumns: ProgCol[];
    protected columnList: DFLinkOutOpPanelModelColumnInfo[];
    protected event: Function;
    private readonly validTypes: ColumnType[] = [];

    public constructor(dagNode: DagNode, event: Function) {
        this.dagNode = dagNode;
        this.event = event;
        BaseOpPanel.getBasicColTypes(true).forEach((type) => {
                this.validTypes.push(type);
        });
        const param: DagNodeDFOutInputStruct = this.dagNode.getParam();
        const columns = param.columns;
        this._updateColumns(columns);
    }

    public getColumns(): ProgCol[] {
        return this.tableColumns;
    }

    public getColumnList(): DFLinkOutOpPanelModelColumnInfo[] {
        return this.columnList;
    }

    /**
     * Sets all columns to be selected or not
     * @param selected
     */
    public setAllCol(selected: boolean): void {
        this.columnList.forEach((column: DFLinkOutOpPanelModelColumnInfo) => {
            column.isSelected = selected;
        });
    }

    /**
     * Toggles the column at the index to be selected or not
     * @param colIndex
     */
    public toggleCol(colIndex: number): void {
        let col: DFLinkOutOpPanelModelColumnInfo = this.columnList[colIndex];
        col.isSelected = !col.isSelected;
        return;
    }

    private _updateColumns(columns) {
        this.tableColumns = this.dagNode.getParents().map((parentNode) => {
            return parentNode.getLineage().getColumns();
        })[0] || [];

        this.tableColumns = this.tableColumns.filter((col) => {
            const colType = col.getType();
            return (this.validTypes.includes(colType));
        });

        this.columnList = this.tableColumns.map(col => {
            return {
                name: col.getBackColName(),
                isSelected: columns.find((column) => {
                    return column.sourceName === col.getBackColName() ||
                           column.name === col.getBackColName();
                }) != null,
                type: col.getType()
            }
        });
    }

    public refreshColumns() {
        const selectedCols = this.columnList.filter(col => {
            return col.isSelected;
        });
        this._updateColumns(selectedCols);
    }
}