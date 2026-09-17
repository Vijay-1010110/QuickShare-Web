/**
 * QuickShare P2P - Cloud Fast-Share Engine
 * Fast direct upload for small files (< 100MB) with real-time speed & progress tracking.
 * Sender does NOT need to keep their browser tab open after upload.
 */

class CloudEngine {
    constructor() {
        this.currentXhr = null;
    }

    /**
     * Upload a file directly
     * @param {File} file
     * @param {Function} onProgress (percent, speedBytesPerSec, uploadedBytes, totalBytes)
     * @returns {Promise<{downloadUrl: string, directUrl: string, fileName: string, fileSize: number}>}
     */
    async uploadFile(file, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            this.currentXhr = xhr;

            let startTime = Date.now();
            let lastLoaded = 0;
            let lastTime = startTime;

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const now = Date.now();
                    const timeDiff = (now - lastTime) / 1000;
                    const bytesDiff = e.loaded - lastLoaded;
                    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

                    lastLoaded = e.loaded;
                    lastTime = now;

                    const percent = Math.round((e.loaded / e.total) * 100);
                    if (onProgress) {
                        onProgress({
                            percent,
                            speed,
                            loaded: e.loaded,
                            total: e.total
                        });
                    }
                }
            });

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    this.currentXhr = null;
                    if (xhr.status === 200) {
                        try {
                            const res = JSON.parse(xhr.responseText);
                            if (res.status === 'success' && res.data && res.data.url) {
                                const rawUrl = res.data.url;
                                // tmpfiles format: https://tmpfiles.org/XXXX/file -> direct: https://tmpfiles.org/dl/XXXX/file
                                const directUrl = rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
                                resolve({
                                    pageUrl: rawUrl,
                                    directUrl: directUrl,
                                    fileName: file.name,
                                    fileSize: file.size
                                });
                            } else {
                                reject(new Error('Invalid response from upload server.'));
                            }
                        } catch (err) {
                            reject(new Error('Failed to parse response: ' + err.message));
                        }
                    } else {
                        reject(new Error('Upload failed with HTTP status: ' + xhr.status));
                    }
                }
            };

            xhr.onerror = () => {
                this.currentXhr = null;
                reject(new Error('Network error during file upload.'));
            };

            xhr.open('POST', 'https://tmpfiles.org/api/v1/upload');
            xhr.send(formData);
        });
    }

    cancelUpload() {
        if (this.currentXhr) {
            this.currentXhr.abort();
            this.currentXhr = null;
        }
    }
}

window.cloudEngine = new CloudEngine();