import { readFile, writeFile } from 'fs/promises';
import { watchFile, unwatchFile, Stats, existsSync } from 'fs';
import throttle from 'lodash.throttle';

type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};

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

    _commitThrottle = 1000;
    _writeThrottle = 1000;

    constructor(filePath: string, initialData?: () => T) {
        this.filePath = filePath;
        this._initialData = initialData;
    }

    init = async () => {
        this.commit = throttle(this._commit, this._commitThrottle);
        this.write = throttle(this._forceWrite, this._writeThrottle);

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
        const str = await readFile(this.filePath, 'utf8');
        if (!str) return;
        this._data = JSON.parse(str);
        for (const ar of this.afterRead) ar(this._data);
    };

    _forceWrite = async () => {
        const str = JSON.stringify(this._data, null, 2);
        await writeFile(this.filePath, str, 'utf8');
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

    query = <J>(reader: (current: DeepReadonly<T>) => J) => {
        return this.commitWait(reader, 'read');
    };
}