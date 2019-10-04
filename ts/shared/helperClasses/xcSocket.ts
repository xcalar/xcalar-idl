interface UserOption {
    user: string;
    id: string;
}

class XcSocket {
    private static _instance: XcSocket;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private _socket: SocketIOClient.Socket;
    private _isRegistered: boolean;
    private _initDeferred: XDDeferred<void>;

    private constructor() {
        this._socket = null;
        this._isRegistered = false; // becomes true when has an active wkbk
        this._initDeferred = null;
    }

    /**
     * xcSocket.setup
     */
    public setup(): void {
        this._initDeferred = PromiseHelper.deferred();
        const url: string = this._getExpServerUrl(hostname);
        this._socket = io.connect(url, {
            "reconnectionAttempts": 10
        });
        this._registerBrowserSession();
        this._addAuthenticationEvents();
        this._addWorkbookEvents();
    }

    public addEventsAfterSetup(): void {
        this._addSocketEvents();
    }

    public checkUserSessionExists(workbookId: string): XDPromise<boolean> {
        const deferred: XDDeferred<boolean> = PromiseHelper.deferred();
        const initDeferred = this._initDeferred;
        // time out after 15s
        this._checkConnection(initDeferred, 15000);

        initDeferred.promise()
        .then(() => {
            const userOption: UserOption = this._getUserOption(workbookId);
            this._socket.emit('checkUserSession', userOption, (exist) => {
                deferred.resolve(exist);
            });

            // time out after 20s
            this._checkConnection(deferred, 20000, true);
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    // when entering a workbook
    public registerUserSession(workbookId: string): boolean {
        if (this._isRegistered) {
            console.warn("already registered");
            return false;
        }

        const userOption: UserOption = this._getUserOption(workbookId);
        this._socket.emit("registerUserSession", userOption, () => {
            console.log("registerSuccess!");
            this._isRegistered = true;
        });

        return true;
    }

    // when deactivating workbook
    public unregisterUserSession(workbookId: string): boolean {
        if (!this._isRegistered) {
            return false;
        }
        this._isRegistered = false;
        const userOption: UserOption = this._getUserOption(workbookId);
        this._socket.emit("unregisterUserSession", userOption, () => {
            console.log("unregisterSuccess!");
        });

        return true;
    }

    public isConnected(): boolean {
        return this._socket.connected;
    }

    public isResigered(): boolean {
        return this._isRegistered;
    }

    public sendMessage(msg: string, arg?: any, callback?: Function): boolean {
        if (this._socket == null) {
            return false;
        }
        this._socket.emit(msg, arg, callback);
        return true;
    }

    private _getExpServerUrl(host: string): string {
        // check if expHost is defined or not at a global level
        // and if expHost is either undefined or null
        if (typeof expHost !== 'undefined' && expHost != null) {
            return expHost;
        }
        return host;
    }

    private _registerBrowserSession() {
        this._socket.emit("registerBrowserSession", XcUser.getCurrentUserName(), () => {
            console.log("browser session registered!");
        });
    }

    // receives events even if user is not in a workbook
    private _addWorkbookEvents(): void {
        const socket = this._socket;
        socket.on("refreshWorkbook", (info) => {
            WorkbookManager.updateWorkbooks(info);
        });
    }

    private _addAuthenticationEvents(): void {
        const socket = this._socket;
        socket.on('error', (error) => {
            console.log('error', error)
        });

        socket.on('connect', () => {
            console.log('socket is connected!');
            this._initDeferred.resolve();
        });

        socket.on('disconnect', () => {
            console.error('socket is disconnected!');
            this._disconnectHandler();
        });

        socket.on('reconnect_failed', () => {
            console.error('connect failed');
            this._initDeferred.reject(AlertTStr.NoConnectToServer);
        });

        socket.on('connect_timeout', (timeout) => {
            console.error('connect timeout', timeout);
            this._initDeferred.reject(AlertTStr.NoConnectToServer);
        });

        socket.on('useSessionExisted', (userOption) => {
            if (!this._isRegistered) {
                return;
            }
            console.log(userOption, 'exists');
            if (userOption.id === WorkbookManager.getActiveWKBK()) {
                WorkbookManager.gotoWorkbook(null, true);
            }
        });

        socket.on('system-allUsers', (userInfos) => {
            if (!this._isRegistered) {
                return;
            }
            XVM.checkMaxUsers(userInfos);
            Admin.updateLoggedInUsers(userInfos);
        });

        socket.on('adminAlert', (alertOption) => {
            if (!this._isRegistered) {
                return;
            }
            Alert.show({
                title: alertOption.title,
                msg: alertOption.message,
                isAlert: true
            });
        });

        socket.on('logout', (_userOption) => {
            // check if the tab still holds valid cookies
            XcUser.checkCurrentUser();
        });

        socket.on('clusterStopWarning', () => {
            if (XVM.isCloud()) {
                XcUser.clusterStopWarning();
            }
        });

        socket.on("logoutMessage", (data) => {
            if (XVM.isCloud()) {
                if (data && data.noCredits) {
                    LogoutModal.Instance.show(true);
                } else {
                    XcUser.logout();
                }
            }
        });

        socket.on("lowCreditWarning", () => {
            if (XVM.isCloud()) {
                MessageModal.Instance.show({
                    title: "You are out of credits...",
                    msg: AlertTStr.ShutDownCredits,
                    sizeToText: true,
                    size: "medium",
                    compact: true,
                    isAlert: true
                });
            }
        });

        socket.on("consoleMsg", (msg) => {
            console.log(msg);
        });
    }

    private _addSocketEvents(): void {
        const socket = this._socket;
        socket.on('refreshDataflow', (updateInfo) => {
            if (!this._isRegistered) {
                return;
            }
            DagSharedActionService.Instance.receive(updateInfo);
        });

        socket.on('refreshUDF', (refreshOption: { isUpdate: boolean, isDelete: boolean }) => {
            if (!this._isRegistered) {
                return;
            }
            UDFFileManager.Instance.refresh(refreshOption.isUpdate, refreshOption.isDelete);
        });

        socket.on('ds.update', (arg) => {
            DS.updateDSInfo(arg);
        });

        socket.on("refreshUserSettings", () => {
            if (!this._isRegistered) {
                return;
            }
            UserSettings.sync();
        });

        socket.on("refreshIMD", (arg) => {
            if (!this._isRegistered) {
                return;
            }
            IMDPanel.updateInfo(arg);
            PTblManager.Instance.updateInfo(arg);
        });

        socket.on("refreshDagCategory", () => {
            if (!this._isRegistered) {
                return;
            }
            DagCategoryBar.Instance.loadCategories();
        });
    }

    private _checkConnection(
        deferred: XDDeferred<any>,
        timeout: number,
        resolve: boolean = false
    ): void {
        setTimeout(() => {
            if (deferred.state() !== 'resolved') {
                if (resolve) {
                    console.error(AlertTStr.NoConnectToServer);
                    deferred.resolve();
                } else {
                    deferred.reject(AlertTStr.NoConnectToServer);
                }
            }
        }, timeout);
    }

    private _getUserOption(workbookId: string): UserOption {
        return {
            user: XcUser.getCurrentUserName(),
            id: workbookId
        };
    }

    /**
     * There are 2 cases, one is server is fine but client somehow disconnect
     * another is server restarts.
     * The disconnect handler on server side already handle case 1
     * so we only need to call hold session again when connect is back
     * Note that socket io will try reconnect and
     * if succeed the connect event will be triggered
     */
    private _disconnectHandler() {
        // connect event will connect to it if works
        this._initDeferred = PromiseHelper.deferred();
        this._isRegistered = false;
        const wkbkId: string = WorkbookManager.getActiveWKBK();
        XcUser.CurrentUser.holdSession(wkbkId, false)
        .fail(function(err) {
            if (err === WKBKTStr.Hold) {
                WorkbookManager.gotoWorkbook(null, true);
            } else {
                // should be an connection error
                XcSupport.checkConnection();
            }
        });
    }
}