class DagNodeSynthesizeInput extends DagNodeInput {
    protected input: DagNodeIndexInputStruct;

    public getInput(replaceParameters?: boolean): DagNodeSynthesizeInputStruct {
        const input = super.getInput(replaceParameters);
        return {
            columns: input.columns || []
        };
    }
}