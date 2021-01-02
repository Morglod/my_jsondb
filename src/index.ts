import * as FS from 'fs/promises';
import { watchFile, unwatchFile, Stats, existsSync } from 'fs';
import throttle from 'lodash.throttle';

export class JsonDB<T> {
    filePath: string;
    _data!: T;
    _watchOpts: { persistent?: boolean; interval?: number; } = { persistent: false, interval: 60 };
    _dispose: (() => any)[] = [];
    commit!: (updater: (current: T) => void, skipWrite?: any) => void;
    write!: () => void;
    afterRead: ((data: T) => void)[] = [];
    _initialData?: () => T;
    _beforeExitForceWrite = true;

    constructor(filePath: string, initialData?: () => T) {
        this.filePath = filePath;
        this._initialData = initialData;
    }

    init = async () => {
        this.commit = throttle(this._commit, 50);
        this.write = throttle(this._forceWrite, 100);

        if (!existsSync(this.filePath) && this._initialData) {
            this._data = this._initialData();
            await this._forceWrite();
        } else {
            await this._read();
        }

        const beforeExit = () => {
            if (this._beforeExitForceWrite) {
                this._forceWrite();
            }
        };

        watchFile(this.filePath, this._watchOpts, this._handleFileChange);
        process.addListener('beforeExit', beforeExit);

        this._dispose.push(() => {
            unwatchFile(this.filePath, this._handleFileChange);
            process.removeListener('beforeExit', beforeExit);
        });
    };

    dispose = async () => {
        for (const f of this._dispose) f();
        this._dispose = [];
    };

    _read = async () => {
        const str = await FS.readFile(this.filePath, 'utf8');
        this._data = JSON.parse(str);
        for (const ar of this.afterRead) ar(this._data);
    };

    _forceWrite = async () => {
        const str = JSON.stringify(this._data, null, 2);
        await FS.writeFile(this.filePath, str, 'utf8');
    };

    _handleFileChange = async (currS: Stats, prevS: Stats) => {
        this.commit(this._read, 'skip write');
    };

    _commit = (updater: (current: T) => void, skipWrite?: any): void => {
        updater(this._data);
        if (!skipWrite) this._forceWrite();
    };

    commitWait = <J>(updater: (current: T) => J, skipWrite?: any) => {
        return new Promise<J>(resolve => {
            this.commit((current) => {
                resolve(updater(current));
            }, skipWrite);
        });
    };
}