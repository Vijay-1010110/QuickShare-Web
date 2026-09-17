/**
 * QuickShare P2P - Storage & Resume Engine
 * Persists downloaded torrent chunks in IndexedDB for seamless resumption.
 */

class StorageResumeManager {
    constructor() {
        this.dbName = 'QuickShare_Chunks_DB';
        this.storeName = 'torrent_pieces';
        this.db = null;
        this.isReady = this.init();
    }

    async init() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('infoHash', 'infoHash', { unique: false });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onerror = (event) => {
                console.warn('[StorageResume] IndexedDB error:', event.target.error);
                resolve(null);
            };
        });
    }

    async savePiece(infoHash, pieceIndex, pieceBuffer) {
        if (!this.db) return;
        try {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            store.put({
                id: ${infoHash}_,
                infoHash: infoHash,
                pieceIndex: pieceIndex,
                data: pieceBuffer,
                timestamp: Date.now()
            });
        } catch (e) {
            console.warn('[StorageResume] Error saving piece:', e);
        }
    }

    async getCachedPieces(infoHash) {
        if (!this.db) return new Map();
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const index = store.index('infoHash');
                const request = index.getAll(infoHash);
                request.onsuccess = () => {
                    const map = new Map();
                    (request.result || []).forEach(item => {
                        map.set(item.pieceIndex, item.data);
                    });
                    resolve(map);
                };
                request.onerror = () => resolve(new Map());
            } catch (e) {
                resolve(new Map());
            }
        });
    }

    async clearTorrent(infoHash) {
        if (!this.db) return;
        try {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const index = store.index('infoHash');
            const request = index.getAllKeys(infoHash);
            request.onsuccess = () => {
                const keys = request.result || [];
                keys.forEach(k => store.delete(k));
            };
        } catch (e) {
            console.warn('[StorageResume] Error clearing pieces:', e);
        }
    }
}

window.storageResume = new StorageResumeManager();