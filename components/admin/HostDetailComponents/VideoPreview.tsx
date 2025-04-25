import React from 'react';

interface VideoPreviewProps {
  url: string;
  description?: string;
}

// 影片處理組件
const VideoPreview: React.FC<VideoPreviewProps> = ({ url, description }) => {
  if (!url) return null;

  const videoUrl = url || '';

  // 解析組件
  const renderVideoEmbed = () => {
    // YouTube 影片處理
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      // 解析不同格式的YouTube網址
      let videoId = '';
      if (videoUrl.includes('youtube.com/watch?v=')) {
        const urlParams = new URLSearchParams(videoUrl.split('?')[1]);
        videoId = urlParams.get('v') || '';
      } else if (videoUrl.includes('youtu.be/')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (videoUrl.includes('youtube.com/embed/')) {
        videoId = videoUrl.split('youtube.com/embed/')[1]?.split('?')[0] || '';
      }

      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        );
      }
    }

    // Vimeo 影片處理
    if (videoUrl.includes('vimeo.com')) {
      const vimeoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
      if (vimeoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          ></iframe>
        );
      }
    }

    // 無法識別的影片連結
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {videoUrl}
        </a>
        <p className="text-sm text-gray-500 mt-2">
          無法嵌入影片，請點擊連結在新視窗中查看
        </p>
      </div>
    );
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">影片介紹</h2>
      <div className="aspect-w-16 aspect-h-9">
        {renderVideoEmbed()}
      </div>
      {description && (
        <p className="mt-2 text-sm text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
};

export default VideoPreview;