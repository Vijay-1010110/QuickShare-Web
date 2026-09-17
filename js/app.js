/**
 * QuickShare P2P & Cloud - Main UI & Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabTorrent = document.getElementById('tab-torrent');
    const tabCloud = document.getElementById('tab-cloud');
    const panelTorrent = document.getElementById('panel-torrent');
    const panelCloud = document.getElementById('panel-cloud');

    // Torrent Elements
    const dropzoneTorrent = document.getElementById('dropzone-torrent');
    const fileInputTorrent = document.getElementById('file-input-torrent');
    const folderInputTorrent = document.getElementById('folder-input-torrent');
    const btnSelectFiles = document.getElementById('btn-select-files');
    const btnSelectFolder = document.getElementById('btn-select-folder');
    const transferCardTorrent = document.getElementById('transfer-card-torrent');
    const torrentFileList = document.getElementById('torrent-file-list');
    const statSpeedUp = document.getElementById('stat-speed-up');
    const statSpeedDown = document.getElementById('stat-speed-down');
    const statPeers = document.getElementById('stat-peers');
    const statEta = document.getElementById('stat-eta');
    const progressBarTorrent = document.getElementById('progress-bar-torrent');
    const progressTextTorrent = document.getElementById('progress-text-torrent');
    const progressSizeTorrent = document.getElementById('progress-size-torrent');
    const shareBoxTorrent = document.getElementById('share-box-torrent');
    const shareLinkTorrent = document.getElementById('share-link-torrent');
    const btnCopyTorrent = document.getElementById('btn-copy-torrent');
    const btnQrTorrent = document.getElementById('btn-qr-torrent');
    const btnPauseResumeTorrent = document.getElementById('btn-pause-resume-torrent');

    // Cloud Elements
    const dropzoneCloud = document.getElementById('dropzone-cloud');
    const fileInputCloud = document.getElementById('file-input-cloud');
    const btnSelectCloud = document.getElementById('btn-select-cloud');
    const transferCardCloud = document.getElementById('transfer-card-cloud');
    const cloudFileName = document.getElementById('cloud-file-name');
    const cloudFileSize = document.getElementById('cloud-file-size');
    const statCloudSpeed = document.getElementById('stat-cloud-speed');
    const progressBarCloud = document.getElementById('progress-bar-cloud');
    const progressTextCloud = document.getElementById('progress-text-cloud');
    const shareBoxCloud = document.getElementById('share-box-cloud');
    const shareLinkCloud = document.getElementById('share-link-cloud');
    const btnCopyCloud = document.getElementById('btn-copy-cloud');
    const btnDownloadCloud = document.getElementById('btn-download-cloud');

    // Modal & Toast
    const qrModal = document.getElementById('qr-modal');
    const qrClose = document.getElementById('qr-close');
    const toastContainer = document.getElementById('toast-container');

    // Tab Switching
    tabTorrent.addEventListener('click', () => switchTab('torrent'));
    tabCloud.addEventListener('click', () => switchTab('cloud'));

    function switchTab(mode) {
        if (mode === 'torrent') {
            tabTorrent.classList.add('active');
            tabCloud.classList.remove('active');
            panelTorrent.classList.add('active');
            panelCloud.classList.remove('active');
        } else {
            tabCloud.classList.add('active');
            tabTorrent.classList.remove('active');
            panelCloud.classList.add('active');
            panelTorrent.classList.remove('active');
        }
    }

    // Toast Notifications
    function showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Global copy direct link helper
    window.copyDirectLink = function(relativePath) {
        const fullUrl = new URL(relativePath, window.location.href).href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullUrl).then(() => {
                showToast('Direct link copied: ' + fullUrl);
            }).catch(() => {
                prompt('Direct download link:', fullUrl);
            });
        } else {
            prompt('Direct download link:', fullUrl);
        }
    };

    // Modal QR Code
    function openQrModal(url) {
        qrModal.classList.add('open');
        if (typeof QRCode !== 'undefined') {
            const container = document.getElementById('qr-container');
            container.innerHTML = '';
            new QRCode(container, {
                text: url,
                width: 220,
                height: 220,
                colorDark: '#0f172a',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }

    qrClose.addEventListener('click', () => qrModal.classList.remove('open'));
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.classList.remove('open');
    });

    // -------------------------------------------------------------
    // TORRENT P2P LOGIC
    // -------------------------------------------------------------

    btnSelectFiles.addEventListener('click', () => fileInputTorrent.click());
    btnSelectFolder.addEventListener('click', () => folderInputTorrent.click());

    fileInputTorrent.addEventListener('change', (e) => handleTorrentFiles(e.target.files));
    folderInputTorrent.addEventListener('change', (e) => handleTorrentFiles(e.target.files));

    // Drag & Drop
    dropzoneTorrent.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneTorrent.classList.add('dragover');
    });

    dropzoneTorrent.addEventListener('dragleave', () => {
        dropzoneTorrent.classList.remove('dragover');
    });

    dropzoneTorrent.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzoneTorrent.classList.remove('dragover');
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            const files = [];
            for (let i = 0; i < items.length; i++) {
                const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : null;
                if (entry) {
                    await traverseFileTree(entry, files);
                } else if (items[i].kind === 'file') {
                    files.push(items[i].getAsFile());
                }
            }
            if (files.length > 0) handleTorrentFiles(files);
        } else if (e.dataTransfer.files.length > 0) {
            handleTorrentFiles(e.dataTransfer.files);
        }
    });

    async function traverseFileTree(item, fileList, path = '') {
        if (item.isFile) {
            await new Promise((resolve) => {
                item.file((file) => {
                    file.customPath = path + file.name;
                    fileList.push(file);
                    resolve();
                });
            });
        } else if (item.isDirectory) {
            const dirReader = item.createReader();
            await new Promise((resolve) => {
                dirReader.readEntries(async (entries) => {
                    for (let i = 0; i < entries.length; i++) {
                        await traverseFileTree(entries[i], fileList, path + item.name + '/');
                    }
                    resolve();
                });
            });
        }
    }

    async function handleTorrentFiles(fileList) {
        if (!fileList || fileList.length === 0) return;
        const files = Array.from(fileList);
        
        dropzoneTorrent.style.display = 'none';
        transferCardTorrent.style.display = 'block';

        showToast(`Preparing ${files.length} file(s) for P2P streaming...`);

        try {
            await window.torrentEngine.seed(files);
        } catch (err) {
            showToast('Error seeding: ' + err.message);
        }
    }

    // Torrent Callbacks
    window.torrentEngine.onTorrentReady = (torrent) => {
        const isSeeding = torrent.progress === 1;
        const shareUrl = `${window.location.origin}${window.location.pathname}#magnet=${encodeURIComponent(torrent.magnetURI)}`;
        shareLinkTorrent.value = shareUrl;
        shareBoxTorrent.style.display = 'flex';

        // Render file list
        renderFileList(torrent.files);

        if (isSeeding) {
            showToast('P2P swarm live! Share the link or QR code.');
        } else {
            showToast('Connected to swarm. Downloading...');
        }
    };

    window.torrentEngine.onStatsUpdate = (stats) => {
        statSpeedUp.textContent = TorrentEngine.formatSpeed(stats.uploadSpeed);
        statSpeedDown.textContent = TorrentEngine.formatSpeed(stats.downloadSpeed);
        statPeers.textContent = stats.numPeers;
        statEta.textContent = TorrentEngine.formatTime(stats.timeRemaining);

        const pct = stats.percent;
        progressBarTorrent.style.width = pct + '%';
        progressTextTorrent.textContent = pct + '%';
        progressSizeTorrent.textContent = `${TorrentEngine.formatBytes(stats.downloaded)} / ${TorrentEngine.formatBytes(stats.total)}`;
    };

    window.torrentEngine.onTorrentDone = (torrent) => {
        showToast('Transfer 100% completed!');
        progressBarTorrent.style.width = '100%';
        progressTextTorrent.textContent = '100%';

        renderCompletedFiles(torrent);
    };

    function renderFileList(files) {
        torrentFileList.innerHTML = '';
        (files || []).forEach(f => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-item-name">
                    <span>📄</span>
                    <span>${f.path || f.name}</span>
                </div>
                <div class="file-item-size">${TorrentEngine.formatBytes(f.length)}</div>
            `;
            torrentFileList.appendChild(item);
        });
    }

    function renderCompletedFiles(torrent) {
        torrentFileList.innerHTML = '';
        torrent.files.forEach(f => {
            const item = document.createElement('div');
            item.className = 'file-item';
            
            const nameEl = document.createElement('div');
            nameEl.className = 'file-item-name';
            nameEl.innerHTML = `<span>✅</span> <span>${f.name}</span>`;

            const btn = document.createElement('button');
            btn.className = 'btn btn-primary';
            btn.style.padding = '0.35rem 0.75rem';
            btn.style.fontSize = '0.8rem';
            btn.textContent = 'Save File';
            btn.onclick = () => {
                f.getBlobURL((err, url) => {
                    if (err) return showToast('Error getting file: ' + err.message);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = f.name;
                    a.click();
                });
            };

            item.appendChild(nameEl);
            item.appendChild(btn);
            torrentFileList.appendChild(item);
        });
    }

    btnCopyTorrent.addEventListener('click', () => {
        shareLinkTorrent.select();
        navigator.clipboard.writeText(shareLinkTorrent.value);
        showToast('Copied link to clipboard!');
    });

    btnQrTorrent.addEventListener('click', () => {
        if (shareLinkTorrent.value) {
            openQrModal(shareLinkTorrent.value);
        }
    });

    btnPauseResumeTorrent.addEventListener('click', () => {
        if (window.torrentEngine.isPaused) {
            window.torrentEngine.resume();
            btnPauseResumeTorrent.textContent = 'Pause';
            showToast('Resumed transfer.');
        } else {
            window.torrentEngine.pause();
            btnPauseResumeTorrent.textContent = 'Resume';
            showToast('Paused transfer.');
        }
    });

    // -------------------------------------------------------------
    // CLOUD FAST-SHARE LOGIC (Small Files)
    // -------------------------------------------------------------

    btnSelectCloud.addEventListener('click', () => fileInputCloud.click());
    fileInputCloud.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleCloudUpload(e.target.files[0]);
        }
    });

    dropzoneCloud.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneCloud.classList.add('dragover');
    });

    dropzoneCloud.addEventListener('dragleave', () => {
        dropzoneCloud.classList.remove('dragover');
    });

    dropzoneCloud.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneCloud.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleCloudUpload(e.dataTransfer.files[0]);
        }
    });

    async function handleCloudUpload(file) {
        if (file.size > 100 * 1024 * 1024) {
            showToast('File is > 100MB! Use the P2P Torrent tab for unlimited size.');
            switchTab('torrent');
            return;
        }

        dropzoneCloud.style.display = 'none';
        transferCardCloud.style.display = 'block';
        cloudFileName.textContent = file.name;
        cloudFileSize.textContent = TorrentEngine.formatBytes(file.size);

        try {
            const res = await window.cloudEngine.uploadFile(file, (progress) => {
                progressBarCloud.style.width = progress.percent + '%';
                progressTextCloud.textContent = progress.percent + '%';
                statCloudSpeed.textContent = TorrentEngine.formatSpeed(progress.speed);
            });

            showToast('Upload complete!');
            progressBarCloud.style.width = '100%';
            progressTextCloud.textContent = '100%';
            statCloudSpeed.textContent = 'Complete';

            const shareUrl = `${window.location.origin}${window.location.pathname}#cloud=${encodeURIComponent(res.directUrl)}`;
            shareLinkCloud.value = shareUrl;
            shareBoxCloud.style.display = 'flex';
            btnDownloadCloud.href = res.directUrl;
        } catch (err) {
            showToast('Upload failed: ' + err.message);
        }
    }

    btnCopyCloud.addEventListener('click', () => {
        shareLinkCloud.select();
        navigator.clipboard.writeText(shareLinkCloud.value);
        showToast('Copied cloud link to clipboard!');
    });

    // -------------------------------------------------------------
    // AUTO-RECEIVER (Hash Router)
    // -------------------------------------------------------------
    const hash = window.location.hash;
    if (hash.startsWith('#magnet=')) {
        const magnet = decodeURIComponent(hash.replace('#magnet=', ''));
        switchTab('torrent');
        dropzoneTorrent.style.display = 'none';
        transferCardTorrent.style.display = 'block';
        showToast('Connecting to P2P swarm from link...');
        window.torrentEngine.download(magnet);
    } else if (hash.startsWith('#cloud=')) {
        const cloudUrl = decodeURIComponent(hash.replace('#cloud=', ''));
        switchTab('cloud');
        dropzoneCloud.style.display = 'none';
        transferCardCloud.style.display = 'block';
        shareBoxCloud.style.display = 'flex';
        shareLinkCloud.value = cloudUrl;
        btnDownloadCloud.href = cloudUrl;
        cloudFileName.textContent = 'Shared Cloud File';
        cloudFileSize.textContent = 'Ready for 1-click download';
        progressBarCloud.style.width = '100%';
        progressTextCloud.textContent = 'Ready';
        showToast('Cloud file link detected!');
    }
});