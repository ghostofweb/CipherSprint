// Saves a Blob as a file. Uses an object URL with an anchor attached to the
// DOM: reliable filenames, and none of the size limits of a giant data: URI.
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a beat to start the download before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
