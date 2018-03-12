const readableFileSize = (bytes, si) => {
    // Taken from https://stackoverflow.com/a/14919494/2302269
    const thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    const units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    let u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

const readableTime = (date) => {
    // Taken from PM2 source code
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
  
    if (interval > 1) {
      return interval + 'Y';
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + 'M';
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + 'D';
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + 'h';
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + 'm';
    }
    return Math.floor(seconds) + 's';
}

module.exports = {
  readableFileSize,
  readableTime
}