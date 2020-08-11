// Browser side (cloud.xcalar.com)
class CloudManager {
    private static _instance: CloudManager;

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private _apiUrl: string;
    private _s3Info: {bucket: string};

    public constructor() {}

    /**
     * CloudManager.Instance.setup
     */
    public setup(): XDPromise<void> {
        if (!XVM.isCloud()) {
            return PromiseHelper.resolve();
        }
        this._removeNonCloudFeature();
        this.checkCloud();
        return this.setApiUrl();
    }

    public setApiUrl(): XDPromise<void> {
        const deferred: XDDeferred<any> = PromiseHelper.deferred();
        xcHelper.sendRequest("GET", "/service/getApiUrl")
        .then((apiUrl) => {
            this._apiUrl = apiUrl;
            deferred.resolve();
        })
        .fail((e) => {
            console.error("Failed to set cloud api url.", e);
            // always resolve as cloud setup failure shouldn't block other components
            deferred.resolve();
        });
        return deferred.promise();
    }
    /**
     * CloudManager.Instance.getS3BucketInfo
     */
    public getS3BucketInfo(): XDPromise<{bucket: string}> {
        if (this._s3Info != null) {
            return PromiseHelper.resolve(this._s3Info);
        }

        const deferred: XDDeferred<any> = PromiseHelper.deferred();
        this._sendRequest("s3/describe", {})
        .then((res: {bucketName: string}) => {
            this._s3Info = {
                bucket: res.bucketName
            };
            deferred.resolve(this._s3Info);
        })
        .fail(deferred.reject);

        return deferred.promise();
    }

    /**
     * CloudManager.Instance.uploadToS3
     * Upload a file to an S3 bucket
     * @param fileName the file's name
     * @param file file to upload
     */
    public uploadToS3(fileName: string, file: File): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();

        xcHelper.readFile(file)
        .then((fileContent) => {
            return this._sendRequest("s3/upload",{
                "fileName": fileName,
                "data": fileContent
            });
        })
        .then(deferred.resolve)
        .fail(deferred.reject);

        return deferred.promise();
    }

    /**
     * CloudManager.Instance.deleteS3File
     * delete a file from s3 bucket
     * @param fileName
     */
    public deleteS3File(fileName: string): XDPromise<void> {
        return this._sendRequest("s3/delete", {
            "fileName": fileName
        });
    }

    public checkCloud(): XDPromise<void> {
        const deferred: XDDeferred<void> = PromiseHelper.deferred();
        if (!XVM.isCloud()) {
            return PromiseHelper.resolve();
        }
        xcHelper.sendRequest("GET", "/service/checkCloud")
        .then((ret) => {
            if (!ret || ret.status !== 0 || !ret.clusterUrl) {
                // deferred.resolve();return; // XXX temporary
                if (ret.error) {
                    deferred.reject(ret.error);
                } else {
                    deferred.reject("Cluster is not started.");
                }
            } else {
                XcUser.setClusterPrice(ret.clusterPrice);
                deferred.resolve();
            }
        })
        .fail((e) => {
            deferred.reject(e);
        });
        return deferred.promise();
    }

    private _removeNonCloudFeature(): void {
        $("#shellPanel").remove();
        $("#debugViewContainer .tab[data-tab=console]").remove();
    }

    // XXX TODO: check if the implementation is correct
    private _getUserName(): string {
        return XcUser.CurrentUser.getFullName();
    }

    private _sendRequest(action: string, payload: object): XDPromise<any> {
        const deferred: XDDeferred<any> = PromiseHelper.deferred();
        const url: string = `${this._apiUrl}/${action}`;
        payload = {
            "username": this._getUserName(),
            ...payload
        }
        fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        })
        .then(res => {
            if (res.status === httpStatus.OK) {
                return res.json();
            } else {
                return PromiseHelper.reject();
            }
        })
        .then((res: {status: number}) => {
            // XXX TODO: use a enum instead of 0
            if (res.status === 0) {
                deferred.resolve(res);
            } else {
                deferred.reject();
            }
        })
        .catch((e) => {
            deferred.reject(e);
        });

        return deferred.promise();
    }
}