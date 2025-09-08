// This file redirects to the CDN-hosted PDF.js worker
// It serves as a fallback if CDN is unavailable
if (typeof importScripts === 'function') {
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js');
}
