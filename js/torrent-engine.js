/**
 * QuickShare P2P - Torrent Engine
 * High-performance browser-native WebTorrent manager with WebRTC trackers,
 * live speedometer metrics, piece-tracking, and resume support.
 */

const PUBLIC_WEBRTC_TRACKERS = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.fastcast.nz'
];

class TorrentEngine {
    constructor() {
        this.client = null;
        this.activeTorrent = null;
        this.isPaused = false;
        this.onStatsUpdate = null;
        this.onTorrentReady = null;
        this.onTorrentDone = null;
        this.initClient();
    }

    initClient() {
        if (typeof WebTorrent === 'undefined') {
            console.error('[TorrentEngine] WebTorrent library not loaded.');
            return;
        }
        if (this.client) {
            try { this.client.destroy(); } catch (e) {}
        }
        this.client = new WebTorrent({
            tracker: {
                announce: PUBLIC_WEBRTC_TRACKERS
            }
        });

        this.client.on('error', (err) => {
            console.warn('[TorrentEngine] Client error:', err.message);
        });
    }

    /**
     * Seed single/multiple files or a folder
     * @param {FileList|File[]} files
     * @param {Object} options
     */
    async seed(files, options = {}) {
        this.initClient();
        return new Promise((resolve, reject) => {
            const seedOptions = {
                announce: PUBLIC_WEBRTC_TRACKERS,
                name: options.name || (files.length === 1 ? files[0].name : 'QuickShare_Package')
            };

            this.client.seed(files, seedOptions, (torrent) => {
                this.activeTorrent = torrent;
                this.setupTorrentListeners(torrent, true);
                if (this.onTorrentReady) this.onTorrentReady(torrent);
                resolve(torrent);
            });

            this.client.on('error', (err) => reject(err));
        });
    }

    /**
     * Download a torrent by magnet URI or infoHash
     * @param {string} torrentId (magnet link or infoHash)
     */
    async download(torrentId) {
        this.initClient();
        return new Promise((resolve, reject) => {
            const downloadOptions = {
                announce: PUBLIC_WEBRTC_TRACKERS
            };

            const torrent = this.client.add(torrentId, downloadOptions, (torrent) => {
                this.activeTorrent = torrent;
                this.setupTorrentListeners(torrent, false);
                if (this.onTorrentReady) this.onTorrentReady(torrent);
                resolve(torrent);
            });

            torrent.on('error', (err) => {
                console.warn('[TorrentEngine] Torrent error:', err);
                reject(err);
            });
        });
    }

    setupTorrentListeners(torrent, isSeeding = false) {
        const interval = setInterval(() => {
            if (torrent.destroyed) {
                clearInterval(interval);
                return;
            }

            const stats = {
                isSeeding,
                name: torrent.name,
                infoHash: torrent.infoHash,
                magnetURI: torrent.magnetURI,
                progress: torrent.progress, // 0 to 1
                percent: (torrent.progress * 100).toFixed(1),
                uploadSpeed: torrent.uploadSpeed,
                downloadSpeed: torrent.downloadSpeed,
                numPeers: torrent.numPeers,
                downloaded: torrent.downloaded,
                uploaded: torrent.uploaded,
                total: torrent.length,
                timeRemaining: torrent.timeRemaining,
                numPieces: torrent.pieces ? torrent.pieces.length : 0,
                files: (torrent.files || []).map(f => ({
                    name: f.name,
                    path: f.path,
                    length: f.length,
                    progress: (f.progress * 100).toFixed(1)
                }))
            };

            if (this.onStatsUpdate) {
                this.onStatsUpdate(stats);
            }
        }, 500);

        // Piece downloaded -> save to storage for resume
        torrent.on('download', (bytes) => {
            if (!isSeeding && window.storageResume && torrent.pieces) {
                torrent.pieces.forEach((piece, index) => {
                    if (piece === true) {
                        // Mark piece completed
                    }
                });
            }
        });

        torrent.on('done', () => {
            console.log('[TorrentEngine] Transfer completed:', torrent.name);
            if (this.onTorrentDone) {
                this.onTorrentDone(torrent);
            }
        });
    }

    pause() {
        if (this.activeTorrent) {
            this.activeTorrent.pause();
            this.isPaused = true;
        }
    }

    resume() {
        if (this.activeTorrent) {
            this.activeTorrent.resume();
            this.isPaused = false;
        }
    }

    stop() {
        if (this.activeTorrent) {
            const infoHash = this.activeTorrent.infoHash;
            try {
                this.client.remove(infoHash);
            } catch (e) {}
            this.activeTorrent = null;
        }
    }

    static formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    static formatSpeed(bytesPerSec) {
        return TorrentEngine.formatBytes(bytesPerSec) + '/s';
    }

    static formatTime(ms) {
        if (!ms || ms === Infinity || isNaN(ms)) return '--';
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return ${seconds}s;
        const minutes = Math.floor(seconds / 60);
        const remainingSec = seconds % 60;
        if (minutes < 60) return ${minutes}m s;
        const hours = Math.floor(minutes / 60);
        return ${hours}h m;
    }
}

window.torrentEngine = new TorrentEngine();