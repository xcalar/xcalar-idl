class DagTabShared extends DagTab {
    // XXX TODO: encrypt it
    private static readonly _secretUser: string = ".xcalar.shared.df";
    private static readonly _delim: string = "_Xcalar_";
    private static _currentSession: string;
    private _createdUser: string;
    private _shortName: string;

    /**
     * DagTabShared.restore
     */
    public static restore(): XDPromise<DagTabShared[]> {
        const deferred: XDDeferred<DagTabShared[]> = PromiseHelper.deferred();
        this._switchSession(null);
        XcalarListWorkbooks("*")
        .then((res: {sessions: any[]}) => {
            const dags: DagTabShared[] = res.sessions.map((sessionInfo) => {
                const name: string = sessionInfo.name;
                const id: string = sessionInfo.sessionId;
                return new DagTabShared(name, id);
            });
            deferred.resolve(dags);
        })
        .fail(deferred.reject);

        this._resetSession();
        return deferred.promise();
    }

    private static _switchSession(sharedDFName: string): void {
        this._currentSession = sessionName;
        const user: XcUser = new XcUser(this._secretUser);
        XcUser.setUserSession(user);
        setSessionName(sharedDFName);
    }

    private static _resetSession(): void {
        XcUser.resetUserSession();
        setSessionName(this._currentSession);
    }

    public constructor(name: string, id?: string, graph?: DagGraph) {
        super(name, id, graph);
        const parsed: {user: string, name: string} = this._parseName(name);
        this._createdUser = parsed.user || XcUser.CurrentUser.getName();
        this.setName(parsed.name); // override name
        this._kvStore = new KVStore("DF2", gKVScope.WKBK);
    }

    public getName(): string {
        return `/${this._createdUser}/${this._shortName}`;
    }

    public setName(newName: string): void {
        this._shortName = newName;
        super.setName(this._normalizeName());
        // XXX TODO rename the underlying workbook
    }

    public load(): XDPromise<void> {
        DagTabShared._switchSession(this._name);
        const promise = this._loadFromKVStore();
        DagTabShared._resetSession();
        return promise;
    }

    // XXX TODO
    public save(): XDPromise<void> {
        return PromiseHelper.resolve();
    }

    public delete(): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        DagTabShared._switchSession(null);
        XcalarDeleteWorkbook(this._name)
        .then(deferred.resolve)
        .fail((error) => {
            if (error.status === StatusT.StatusSessionNotFound) {
                deferred.resolve();
            } else {
                deferred.reject(error);
            }
        });

        DagTabShared._resetSession();
        return deferred.promise();
    }

    public upload(content: string): XDPromise<void> {
        DagTabShared._switchSession(null);
        const promise = XcalarUploadWorkbook(this._name, content, "");
        DagTabShared._resetSession();
        return promise;
    }

    public download(): XDPromise<void> {
        const fileName: string = `${this._shortName}.tar.gz`;
        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        DagTabShared._switchSession(this._name);
        // XXX TODO, backend should give a flag about it's DF or WKBK
        XcalarDownloadWorkbook(this._name, "")
        .then((file) => {
            xcHelper.downloadAsFile(fileName, file.sessionContent, true);
            deferred.resolve();
        })
        .fail(deferred.reject);

        DagTabShared._resetSession();
        return deferred.promise();
    }

    public canEdit(): boolean {
        return this._createdUser === XcUser.CurrentUser.getName();
    }

    private _parseName(wholeName: string): {user: string ,name: string} {
        let userPart: string = null;
        let namePart: string = wholeName;
        try {
            const nameSplit: string[] = wholeName.split(DagTabShared._delim);
            if (nameSplit.length === 2) {
                // when it's  user_Xcalar_name
                userPart = nameSplit[0];
                namePart = nameSplit[1];
            }
        } catch (e) {
            console.error(e);
        }
        return {
            user: userPart,
            name: namePart
        };
    }

    private _normalizeName(): string {
        return `${this._createdUser}${DagTabShared._delim}${this._shortName}`;
    }
}