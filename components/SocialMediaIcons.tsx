import React from 'react';

interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  threads?: string;
  tiktok?: string;
  line?: string;
  website?: string;
  other?: {
    name: string;
    url: string;
  }[];
}

interface SocialMediaIconsProps {
  links: SocialMediaLinks;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SocialMediaIcons: React.FC<SocialMediaIconsProps> = ({
  links,
  size = 'md',
  className = ''
}) => {
  // 根據尺寸設定圖標大小
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {links.facebook && (
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Facebook"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </a>
      )}

      {links.instagram && (
        <a
          href={links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-800 transition-colors"
          aria-label="Instagram"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12.315 2c1.532 0 1.937.007 2.607.037 1.72.08 2.923 1.283 3.002 3.003.03.67.037 1.075.037 2.607 0 1.532-.007 1.937-.037 2.607-.08 1.72-1.283 2.923-3.002 3.003-.67.03-1.075.037-2.607.037-1.532 0-1.937-.007-2.607-.037-1.72-.08-2.923-1.283-3.003-3.003-.03-.67-.037-1.075-.037-2.607 0-1.532.007-1.937.037-2.607.08-1.72 1.283-2.923 3.003-3.003.67-.03 1.075-.037 2.607-.037zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8.333a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.339-9.839a1.17 1.17 0 100 2.34 1.17 1.17 0 000-2.34z"></path>
          </svg>
        </a>
      )}

      {links.linkedin && (
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-900 transition-colors"
          aria-label="LinkedIn"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
          </svg>
        </a>
      )}

      {links.twitter && (
        <a
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Twitter"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
          </svg>
        </a>
      )}

      {links.youtube && (
        <a
          href={links.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600 hover:text-red-800 transition-colors"
          aria-label="YouTube"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
          </svg>
        </a>
      )}

      {links.threads && (
        <a
          href={links.threads}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:text-gray-700 transition-colors"
          aria-label="Threads"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01c-.028-3.581.859-6.446 2.635-8.513C6.007 1.405 8.771.215 12.372.215c3.132 0 5.771.85 7.851 2.5 2.444 1.932 3.644 4.987 3.644 9.065 0 3.347-.839 5.927-2.475 7.643-1.16 1.22-2.577 1.834-4.229 1.834-1.63 0-2.853-.614-3.74-1.833-.413-.57-.71-1.232-.898-1.97-.841 1.595-2.338 2.509-4.333 2.509-1.874 0-3.387-.736-4.488-2.192-1.043-1.373-1.573-3.12-1.573-5.2 0-2.044.516-3.811 1.538-5.252 1.116-1.574 2.656-2.37 4.579-2.37 1.913 0 3.413.835 4.476 2.485l.117-1.62h3.107l-.758 8.845c-.083.956-.132 1.718-.132 2.288 0 .516.072.941.22 1.28.298.7.855 1.05 1.661 1.05.711 0 1.366-.4 1.947-1.19 1.102-1.486 1.661-3.616 1.661-6.343 0-3.035-.877-5.305-2.606-6.75C16.95 2.55 14.956 1.95 12.372 1.95c-2.968 0-5.302.962-6.933 2.857-1.546 1.794-2.329 4.188-2.329 7.123 0 3.041.88 5.46 2.619 7.208 1.63 1.643 3.913 2.5 6.789 2.525h.007c.043 0 .087 0 .131-.002 1.543-.024 3.5-.244 4.955-1.75l1.279 1.095c-1.997 2.067-4.616 2.347-6.251 2.383-.043 0-.087.002-.13.002zM12.504 7.95c-1.102 0-1.982.476-2.614 1.416-.595.886-.897 2.002-.897 3.316 0 1.325.313 2.432.93 3.282.55.756 1.259 1.13 2.156 1.13.913 0 1.638-.394 2.22-1.195.629-.866.95-2.026.95-3.447 0-1.305-.328-2.387-.97-3.212-.578-.742-1.325-1.11-2.254-1.11-.173 0-.347.013-.521.04z"></path>
          </svg>
        </a>
      )}

      {links.tiktok && (
        <a
          href={links.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:text-gray-700 transition-colors"
          aria-label="TikTok"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"></path>
          </svg>
        </a>
      )}

      {links.line && (
        <a
          href={links.line}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-500 hover:text-green-700 transition-colors"
          aria-label="Line"
        >
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.365 9.89c.50 0 .907.41.907.91 0 .5-.407.91-.907.91H17.59v1.306h1.775c.5 0 .907.41.907.908 0 .502-.407.91-.907.91h-2.682c-.5 0-.908-.408-.908-.91V8.19c0-.5.407-.91.908-.91h2.682c.5 0 .907.41.907.91 0 .5-.407.91-.907.91H17.59v1.773h1.775zm-6.49 3.127c.5 0 .908.408.908.91 0 .5-.41.907-.91.907h-2.68c-.5 0-.907-.408-.907-.908V8.19c0-.5.407-.91.907-.91.5 0 .908.41.908.91v4.827h1.773zm-5.063.91c0 .5-.408.908-.908.908-.498 0-.907-.41-.907-.91V8.19c0-.5.41-.91.908-.91.5 0 .907.41.907.91v5.737zm15.905-8.08C22.676 3.155 18.34.44 12.66.068 11.12-.045 9.603-.03 8.05.068 2.39.44-1.965 3.155.985 5.847c2.293 2.09 5.006 3.43 7.758 4.886 1.54.828 3.43 1.126 4.118 2.533.364.773.097 1.742.364 2.532.268.773 1.365.773 2.13.292 1.655-1.05 4.118-1.365 5.847-2.97 2.97-2.68 3.127-6.8 3.515-9.373z"></path>
          </svg>
        </a>
      )}

      {links.website && (
        <a
          href={links.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Website"
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
          </svg>
        </a>
      )}

      {links.other && links.other.map((item, index) => (
        <a
          key={index}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-800 transition-colors"
          aria-label={item.name}
        >
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
        </a>
      ))}
    </div>
  );
};

export default SocialMediaIcons;