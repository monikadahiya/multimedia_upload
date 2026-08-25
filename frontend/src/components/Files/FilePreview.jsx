import React from 'react';

// Renders the right preview element for a Cloudinary-hosted file based on
// its detected category.
export default function FilePreview({ file, className = '' }) {
  switch (file.fileType) {
    case 'image':
      return <img className={className} src={file.url} alt={file.fileName} loading="lazy" />;
    case 'video':
      return (
        <video className={className} src={file.url} controls preload="metadata">
          Your browser does not support video playback.
        </video>
      );
    case 'audio':
      return (
        <div className={`${className} file-preview__audio`}>
          <audio src={file.url} controls preload="metadata" />
        </div>
      );
    case 'pdf':
      return <iframe className={className} src={file.url} title={file.fileName} />;
    default:
      return <div className={className}>Preview unavailable</div>;
  }
}
